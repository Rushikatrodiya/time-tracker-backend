const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const { register, signIn, refresh, signOut } = require("./auth.service");

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: Number(process.env.REFRESH_TOKEN_EXPIRY) * 1000,
};

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const signUpController = asyncHandler(async (req, res) => {
  const { name, email, password, organizationName } = req.body;
  const user = await register({ name, email, password, organizationName });
  return success(res, user, "User registered successfully", 201);
});

const signInController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await signIn({
    email,
    password,
  });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);

  return success(
    res,
    {
      user,
    },
    "User logged in successfully",
    200,
  );
});

const refreshController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } =
    await refresh(refreshToken);

  res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);
  res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);

  return success(res, {}, "Access token generated successfully", 200);
});

const signOutController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await signOut(refreshToken);
  }

  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
  res.clearCookie("accessToken", ACCESS_COOKIE_OPTIONS);

  return success(res, null, "Logged out successfully", 200);
});

module.exports = {
  signUpController,
  signInController,
  refreshController,
  signOutController,
};
