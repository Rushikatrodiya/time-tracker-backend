const { Router } = require("express");
const authMiddleWare = require("../../middlewares/auth.middleware");
const {
  startTimerController,
  endTimeController,
  getAllTimelogsController,
} = require("./timelogs.controller");

const router = Router();

router.post("/start", startTimerController);
router.post("/end", endTimeController);
router.get("/", getAllTimelogsController);

module.exports = router;
