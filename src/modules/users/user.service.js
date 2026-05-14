const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

const getAllUsers = async ({ id, role, organizationId }) => {
  if (!organizationId) {
    throw new AppError("Organization ID is required", 400);
  }
  const users = await prisma.user.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true,
    },
  });
  return users;
};

module.exports = {
  getAllUsers,
};
