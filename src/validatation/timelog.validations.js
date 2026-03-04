const { z } = require("zod");

const startTimerSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

module.exports = {
  startTimerSchema,
};
