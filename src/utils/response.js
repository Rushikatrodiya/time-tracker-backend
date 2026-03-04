const success = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
  pagination = null,
) => {
  const response = {
    success: true,
    statusCode,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

const error = (
  res,
  message = "Internal server error",
  statusCode = 500,
  errors = null,
) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  success,
  error,
};
