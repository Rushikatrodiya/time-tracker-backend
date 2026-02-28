const { Router } = require("express");
const roleMiddleware = require("../../middlewares/role.middleware");
const {
  createTaskController,
  getAllTaskController,
  updateTaskController,
  deleteTaskController,
} = require("./task.controller");

const router = Router();

router.post("/", roleMiddleware("ADMIN", "MANAGER"), createTaskController);
router.get("/", getAllTaskController);
router.put("/:id", updateTaskController);
router.delete("/:id", roleMiddleware("ADMIN", "MANAGER"), deleteTaskController);

module.exports = router;
