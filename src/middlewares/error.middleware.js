const { error } = require("../utils/response");

module.exports = (err, req, res, next) => {
  if (err.isOperational) {
    return error(res, err.message, err.statusCode, err.errors);
  }

  if (err.code === "P2002") {
    return error(res, "Record already exists", 409);
  }

  if (err.code === "P2025") {
    return error(res, "Record not found", 404);
  }

  if (err.code === "P2003") {
    return error(res, "Invalid reference, related record not found", 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return error(res, "Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return error(res, "Token expired", 401);
  }

  // validation errors
  if (err.name === "ValidationError") {
    return error(res, err.message, 400);
  }

  // unknown errors - never expose internals
  console.error("UNEXPECTED ERROR:", err); // log for developer only
};
