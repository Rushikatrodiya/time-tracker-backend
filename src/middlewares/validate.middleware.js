const { error } = require("../utils/response");
const validate = (schema, type = "body") => {
  return (req, res, next) => {
    const data = type === "query" ? req.query : req.body;
    const result = schema.safeParse(data);

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
