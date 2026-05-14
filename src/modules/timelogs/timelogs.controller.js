const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const {
  startTimer,
  endTime,
  getAllTimelogs,
  getAllTasksTotalDuration,
  getTaskTimeLogs,
  upateTaskTimeLog,
  deleteTimeLog,
} = require("./timelogs.service");

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

const getTaskTimeLogsController = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { taskId } = req.params;
  const { timeLogs, totalDuration } = await getTaskTimeLogs(id, taskId);
  return success(
    res,
    { timeLogs, totalDuration },
    "Total duration fetched successfully",
  );
});

const getAllTasksTotalDurationController = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const taskDurations = await getAllTasksTotalDuration(id);
  return success(
    res,
    taskDurations,
    "All tasks total duration fetched successfully",
  );
});

const updateTaskTimeLogController = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { timeLogId } = req.params;
  const { taskId, startTime, endTime, title } = req.body;
  const { timeLog, totalDuration } = await upateTaskTimeLog(
    timeLogId,
    id,
    taskId,
    startTime,
    endTime,
    title,
  );
  return success(
    res,
    { timeLog, totalDuration },
    "Time log updated successfully",
  );
});

const deleteTimeLogController = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { timeLogId } = req.params;
  const totalDuration = await deleteTimeLog(timeLogId, id);
  return success(res, { totalDuration }, "Time log deleted successfully");
});

module.exports = {
  startTimerController,
  endTimeController,
  getAllTimelogsController,
  getTaskTimeLogsController,
  getAllTasksTotalDurationController,
  updateTaskTimeLogController,
  deleteTimeLogController,
};
