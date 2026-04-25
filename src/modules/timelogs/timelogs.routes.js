const { Router } = require("express");
const {
  startTimerController,
  endTimeController,
  getAllTimelogsController,
  getAllTasksTotalDurationController,
  getTaskTimeLogsController,
  updateTaskTimeLogController,
  deleteTimeLogController,
} = require("./timelogs.controller");
const validate = require("../../middlewares/validate.middleware");
const {
  startTimerSchema,
} = require("./../../validatation/timelog.validations");

const router = Router();

router.post("/start", validate(startTimerSchema), startTimerController);
router.post("/end", endTimeController);
router.get("/", getAllTimelogsController);
router.get("/:taskId", getTaskTimeLogsController);
router.get("/all-tasks/durations", getAllTasksTotalDurationController);
router.put("/:timeLogId", updateTaskTimeLogController);
router.delete("/:timeLogId", deleteTimeLogController);

module.exports = router;
