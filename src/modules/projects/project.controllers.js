const asyncHandler = require("../../utils/asyncHandler");
const { createProject, getAllProjects } = require("./project.service");
const { success } = require("../../utils/response");

const createProjectController = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;
  const ownerId = req.user.id;
  const project = await createProject({ name, description, status, ownerId });
  return success(res, project, "Project created successfully", 201);
});

const getAllProjectsController = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  const query = req.query;
  const { data, pagination } = await getAllProjects({
    ownerId: id,
    role,
    query,
  });
  return success(res, data, "Projects fetched successfully", 200, pagination);
});

module.exports = {
  createProjectController,
  getAllProjectsController,
};
