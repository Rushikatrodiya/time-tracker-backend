const { prisma } = require("../../config/db");
const { hashPassword, comparePassword } = require("../../utils/password");
const AppError = require("../../utils/AppError");
const { redisClient } = require("../../config/redis");
const { generateAccessToken, generateRefreshToken } = require("./token.util");

const register = async ({ name, email, password, organizationName }) => {
  if (!name || !email || !password || !organizationName) {
    throw new AppError("All fields are required", 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const hashedPassword = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
      },
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        organizationId: organization.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });

    return user;
  });

  return result;
};

const signIn = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  await redisClient.setEx(
    `refreshToken:${refreshToken}`,
    Number(process.env.REFRESH_TOKEN_EXPIRY),
    String(user.id),
  );

  return { accessToken, refreshToken, user: payload };
};

const refresh = async (refreshToken) => {
  const userId = await redisClient.get(`refreshToken:${refreshToken}`);
  if (!userId) {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await redisClient.del(`refreshToken:${refreshToken}`);

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken();

  await redisClient.setEx(
    `refreshToken:${newRefreshToken}`,
    Number(process.env.REFRESH_TOKEN_EXPIRY),
    String(user.id),
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const signOut = async (refreshToken) => {
  await redisClient.del(`refreshToken:${refreshToken}`);
};

module.exports = {
  register,
  signIn,
  refresh,
  signOut,
};
