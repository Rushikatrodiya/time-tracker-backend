const { z } = require("zod");

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  projectKey: z
    .string()
    .min(4, "Project key must be 4 characters")
    .max(4, "Project key must be 4 characters"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

module.exports = {
  createProjectSchema,
};
