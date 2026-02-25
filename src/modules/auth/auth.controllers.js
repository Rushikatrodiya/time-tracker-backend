const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const { register, signIn, refresh, signOut } = require("./auth.service");

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict", // or "lax" if cross-site
  maxAge: Number(process.env.REFRESH_TOKEN_EXPIRY) * 1000,
};

const signUpController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await register({ name, email, password });
  return success(res, user, "User registered successfully", 201);
});

const signInController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await signIn({
    email,
    password,
  });

  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(
    res,
    {
      accessToken,
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

  return success(
    res,
    {
      accessToken,
    },
    "Access token generated successfully",
    200,
  );
});

const signOutController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await signOut(refreshToken);
  }

  res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

  return success(res, null, "Logged out successfully", 200);
});

module.exports = {
  signUpController,
  signInController,
  refreshController,
  signOutController,
};
