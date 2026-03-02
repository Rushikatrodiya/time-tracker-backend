const { error } = require("../utils/response");
const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((err) => {
        return {
          field: err.path[0],
          message: err.message,
        };
      });
      return error(res, "Validation failed", 400, errors);
    }

    next();
  };
};

module.exports = validate;
