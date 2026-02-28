const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

const createProject = async ({ name, description, status, ownerId }) => {
  if (!name) {
    throw new AppError("Project name is required", 400);
  }

  if (!ownerId) {
    throw new AppError("Owner ID is required", 400);
  }

  if (status && status !== "ACTIVE" && status !== "ARCHIVED") {
    throw new AppError("Status must be either 'ACTIVE' or 'ARCHIVED'", 400);
  }

  return await prisma.project.create({
    data: {
      name,
      description,
      status: status || "ACTIVE",
      ownerId,
    },
  });
};

const getAllProjects = async ({ ownerId, role }) => {
  if (!ownerId || !role) {
    throw new AppError("User not authorized", 400);
  }

  let projects;

  if (role === "ADMIN") {
    projects = await prisma.project.findMany();
  } else {
    projects = await prisma.project.findMany({
      where: { ownerId },
    });
  }

  return projects;
};

module.exports = {
  createProject,
  getAllProjects,
};
