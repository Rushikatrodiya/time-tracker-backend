const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");
const {
  getPaginationResponse,
  getPagination,
} = require("../../utils/pagination");

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

const getAllProjects = async ({ ownerId, role, query }) => {
  if (!ownerId || !role) {
    throw new AppError("User not authorized", 400);
  }

  let where = {};
  if (role != "ADMIN") {
    where = {
      ownerId,
    };
  }
  const { page, limit, offset } = getPagination(query);

  const [projects, totalProjects] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      skip: offset,
      take: limit,
    }),
    prisma.project.count({
      where,
    }),
  ]);

  return {
    data: projects,
    pagination: getPaginationResponse(totalProjects, page, limit),
  };
};

module.exports = {
  createProject,
  getAllProjects,
};
