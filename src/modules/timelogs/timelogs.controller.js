const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const { startTimer, endTime, getAllTimelogs } = require("./timelogs.service");

const startTimerController = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { taskId } = req.body;
  const timelogs = await startTimer(id, taskId);
  return success(res, timelogs, "Timer started successfully");
});

const endTimeController = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const timelogs = await endTime(id);
  return success(res, timelogs, "Timer ended successfully");
});

const getAllTimelogsController = asyncHandler(async (req, res) => {
  const timelogs = await getAllTimelogs(req.user);
  return success(res, timelogs, "Time logs fetched successfully ");
});

module.exports = {
  startTimerController,
  endTimeController,
  getAllTimelogsController,
};
