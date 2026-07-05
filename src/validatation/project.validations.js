const { z } = require("zod");

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  projectKey: z
    .string()
    .min(2, "Project key must be 2 characters")
    .max(4, "Project key must be 4 characters"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};
