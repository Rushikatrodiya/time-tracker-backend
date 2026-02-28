const AppError = require("../utils/AppError");

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log(req.user, "req.user");

      return next(new AppError("Unauthorized", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Access denied.", 403));
    }

    next();
  };
};

module.exports = roleMiddleware;
