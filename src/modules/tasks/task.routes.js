const { Router } = require("express");
const roleMiddleware = require("../../middlewares/role.middleware");
const {
  createTaskController,
  getAllTaskController,
  updateTaskController,
  deleteTaskController,
  getTaskByIdController,
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
router.get("/", validate(getTasksQuerySchema, "query"), getAllTaskController);
router.patch("/:id", validate(updateTaskSchema), updateTaskController);
router.get("/:id", getTaskByIdController);
router.delete("/:id", roleMiddleware("ADMIN", "MANAGER"), deleteTaskController);

module.exports = router;
