const asyncHandler = require("../../utils/asyncHandler");
const { createProject, getAllProjects } = require("./project.service");
const { success } = require("../../utils/response");

const createProjectController = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;
  const { id, organizationId } = req.user;
  const project = await createProject({
    name,
    description,
    status,
    ownerId: id,
    organizationId,
  });
  return success(res, project, "Project created successfully", 201);
});

const getAllProjectsController = asyncHandler(async (req, res) => {
  const { id, role, organizationId } = req.user;
  const query = req.query;

  const { projects, pagination } = await getAllProjects({
    ownerId: id,
    role,
    query,
    organizationId,
  });
  return success(
    res,
    projects,
    "Projects fetched successfully",
    200,
    pagination,
  );
});

module.exports = {
  createProjectController,
  getAllProjectsController,
};
