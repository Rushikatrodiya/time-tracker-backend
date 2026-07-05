const asyncHandler = require("../../utils/asyncHandler");
const { createProject, getAllProjects, updateProject, deleteProject, getSimpleProjectList } = require("./project.service");
const { success } = require("../../utils/response");

const createProjectController = asyncHandler(async (req, res) => {
  const { name, projectKey, description, status } = req.body;
  const { id, organizationId } = req.user;
  const project = await createProject({
    name,
    projectKey,
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

const updateProjectController = asyncHandler(async (req, res) => {
  const { id: userId, role, organizationId } = req.user;
  const { id: projectId } = req.params;
  const { name, description, status, projectKey } = req.body;

  const project = await updateProject({
    projectId,
    name,
    description,
    status,
    projectKey,
    userId,
    role,
    organizationId,
  });
  return success(res, project, "Project updated successfully", 200);
});

const deleteProjectController = asyncHandler(async (req, res) => {
  const { id: userId, role, organizationId } = req.user;
  const { id: projectId } = req.params;

  const result = await deleteProject({
    projectId,
    userId,
    role,
    organizationId,
  });
  return success(res, result, "Project deleted successfully", 200);
});

const getSimpleProjectListController = asyncHandler(async (req, res) => {
  const { id: userId, role, organizationId } = req.user;
  const projects = await getSimpleProjectList({ userId, role, organizationId });

  return success(res, projects, "Project list fetched successfully", 200);
});

module.exports = {
  createProjectController,
  getAllProjectsController,
  updateProjectController,
  deleteProjectController,
  getSimpleProjectListController,
};
