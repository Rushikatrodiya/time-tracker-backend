const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.number(),
  assignedTo: z.number().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.number().optional(),
  dueDate: z.date().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  projectId: z.number().optional(),
  assignedTo: z.number().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.number().optional(),
  dueDate: z.date().optional(),
});

const getTasksQuerySchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["1", "2", "3"]).optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
};
