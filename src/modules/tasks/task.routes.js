const { Router } = require("express");
const roleMiddleware = require("../../middlewares/role.middleware");
const {
  createTaskController,
  updateTaskController,
  deleteTaskController,
  getAllTaskByProjectController,
  getTaskStatsByProjectController,
} = require("./task.controller");
const validate = require("../../middlewares/validate.middleware");
const {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
} = require("./../../validatation/task.validations");

const router = Router();

router.post(
  "/",
  roleMiddleware("ADMIN", "MANAGER"),
  validate(createTaskSchema),
  createTaskController,
);
router.get("/:id/stats", getTaskStatsByProjectController);
router.get("/:id", validate(getTasksQuerySchema, "query"), getAllTaskByProjectController)
router.patch("/:id", validate(updateTaskSchema), updateTaskController);
router.delete("/:id", roleMiddleware("ADMIN", "MANAGER"), deleteTaskController);

module.exports = router;
