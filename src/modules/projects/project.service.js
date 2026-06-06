const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");
const {
  getPaginationResponse,
  getPagination,
} = require("../../utils/pagination");

const createProject = async ({
  name,
  projectKey,
  description,
  status,
  ownerId,
  organizationId,
}) => {
  if (!ownerId) {
    throw new AppError("Owner ID is required", 400);
  }

  return await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        projectKey: projectKey.toUpperCase(),
        description,
        status: status || "ACTIVE",
        ownerId,
        organizationId,
      },
    });

    // Auto-add owner to project membership
    await tx.projectMembership.create({
      data: {
        projectId: project.id,
        userId: ownerId,
      },
    });

    return project;
  });
};

const getAllProjects = async ({ ownerId, role, organizationId, query }) => {
  if (!ownerId || !role) {
    throw new AppError("User not authorized", 400);
  }

  let where = { organizationId };
  if (role !== "ADMIN") {
    where = { ownerId };
  }

  // Add pagination
  const { page, limit, skip } = getPagination(query);

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      include: {
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      owner: project.owner,
      memberCount: project.memberships.length,
    })),
    pagination: getPaginationResponse(page, limit, total),
  };
};

module.exports = {
  createProject,
  getAllProjects,
};
