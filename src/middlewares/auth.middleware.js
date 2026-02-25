const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../modules/auth/token.util");

const authMiddleWare = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];

    const user = verifyAccessToken(token);
    req.user = user;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Access token expired", 401));
    }

    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid access token", 401));
    }

    next(err);
  }
};

module.exports = authMiddleWare;
