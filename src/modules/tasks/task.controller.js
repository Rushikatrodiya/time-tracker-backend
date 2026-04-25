const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getTaskById,
} = require("./task.service");

const createTaskController = asyncHandler(async (req, res) => {
  const { id: currentUserId } = req.user;
  const task = await createTask(req.body, currentUserId);
  return success(res, task, "Task created successfully");
});

const getAllTaskController = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const query = req.query;
  const tasks = await getAllTasks(query, id);
  return success(res, tasks, "Tasks fetched successfully");
});

const updateTaskController = asyncHandler(async (req, res) => {
  const { role } = req.user;
  const data = req.body;
  const { id } = req.params;
  const task = await updateTask(role, data, id);
  return success(res, task, "Task updated sucessfully");
});

const getTaskByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await getTaskById(id);
  return success(res, task, "Task fetched successfully");
});

const deleteTaskController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await deleteTask(id);
  return success(res, task, "Task deleted successfully");
});

module.exports = {
  createTaskController,
  getAllTaskController,
  updateTaskController,
  deleteTaskController,
  getTaskByIdController,
};
