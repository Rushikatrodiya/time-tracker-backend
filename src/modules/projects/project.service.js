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

  if (role === "MANAGER") {
    where = {
      ...where,
      memberships: {
        some: { userId: ownerId, leftAt: null },
      },
    };
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
          where: { leftAt: null },
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
      projectKey: project.projectKey,
    })),
    pagination: getPaginationResponse(page, limit, total),
  };
};

const updateProject = async ({
  projectId,
  name,
  description,
  status,
  userId,
  role,
  organizationId,
}) => {
  if (!projectId) {
    throw new AppError("Project ID is required", 400);
  }

  // Check if project exists and user has permission
  const existingProject = await prisma.project.findFirst({
    where: {
      id: BigInt(projectId),
      ...(role !== "ADMIN" ? { ownerId: userId } : {}),
      organizationId,
    },
  });

  if (!existingProject) {
    throw new AppError("Project not found or not authorized", 404);
  }

  // Prepare update data
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;

  const updatedProject = await prisma.project.update({
    where: { id: BigInt(projectId) },
    data: updateData,
    include: {
      memberships: {
        where: { leftAt: null },
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
  });

  return updatedProject;
};

const deleteProject = async ({ projectId, userId, role, organizationId }) => {
  if (!projectId) {
    throw new AppError("Project ID is required", 400);
  }

  // Check if project exists and user has permission
  const existingProject = await prisma.project.findFirst({
    where: {
      id: BigInt(projectId),
      organizationId,
    },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!existingProject) {
    throw new AppError("Project not found or not authorized", 404);
  }


  // Delete project - cascade deletes are handled by Prisma schema
  await prisma.project.delete({
    where: { id: BigInt(projectId) },
  });

  return { message: "Project deleted successfully" };
};

const getSimpleProjectList = async ({ userId, role, organizationId }) => {
  let where = { organizationId };

  if (role !== "ADMIN") {
    where = {
      ...where,
      memberships: {
        some: { userId, leftAt: null },
      },
    };
  }

  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      projectKey: true,
    },
    orderBy: { name: 'asc' },
  });

  return projects;
};

module.exports = {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
  getSimpleProjectList,
};
