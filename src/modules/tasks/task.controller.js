const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
} = require("./task.service");

const createTaskController = asyncHandler(async (req, res) => {
  const task = await createTask(req.body);
  return success(res, task, "Task created successfully");
});

const getAllTaskController = asyncHandler(async (req, res) => {
  const tasks = await getAllTasks();
  return success(res, tasks, "Tasks fetched successfully");
});

const updateTaskController = asyncHandler(async (req, res) => {
  const { role } = req.user;
  const data = req.body;
  const { id } = req.params;
  console.log("data recieved", id);

  const task = await updateTask(role, data, id);
  return success(res, task, "Task updated sucessfully");
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
};
