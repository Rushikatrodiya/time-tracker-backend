const { z } = require("zod");

const addProjectMemberSchema = z.object({
  userId: z.number().int().positive(),
  role: z.string().optional(),
});

module.exports = {
  addProjectMemberSchema,
};
