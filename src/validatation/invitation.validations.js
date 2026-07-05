const { z } = require("zod");

const createInvitationSchema = z.object({
  email: z.email("Invalid email format"),
  role: z.enum(["ADMIN", "USER", "MANAGER"]).optional().default("USER"),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

module.exports = {
  createInvitationSchema,
  acceptInvitationSchema,
};
