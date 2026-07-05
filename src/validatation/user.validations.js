const { z } = require("zod");

const updateProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
});

const updatePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(1, "New password is required"),
});

module.exports = {
  updateProfileSchema,
  updatePasswordSchema,
};
