const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const {
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTaskStatsByProject
} = require("./task.service");

const createTaskController = asyncHandler(async (req, res) => {
  const { id: currentUserId } = req.user;
  const task = await createTask(req.body, currentUserId);
  return success(res, task, "Task created successfully");
});

const getAllTaskByProjectController = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const { id: projectId } = req.params;
  const query = req.query;
  const tasks = await getTasksByProject(projectId, query, id, role);
  return success(res, tasks, "Tasks fetched successfully");
})

const getTaskStatsByProjectController = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const { id: projectId } = req.params;
  const stats = await getTaskStatsByProject(projectId, id, role);
  return success(res, stats, "Task stats fetched successfully");
});

const updateTaskController = asyncHandler(async (req, res) => {
  const { role } = req.user;
  const data = req.body;
  const { id } = req.params;
  const task = await updateTask(role, data, id);
  return success(res, task, "Task updated sucessfully");
});


const deleteTaskController = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const { id } = req.params;
  const task = await deleteTask(id, userId, role);
  return success(res, task, "Task deleted successfully");
});

module.exports = {
  createTaskController,
  updateTaskController,
  deleteTaskController,
  getAllTaskByProjectController,
  getTaskStatsByProjectController,
};
