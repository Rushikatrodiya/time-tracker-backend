const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");
const {
  getCursorPaginationResponse,
  getCursorPagination,
} = require("../../utils/cursorPagination");

const createTask = async (data, currentUserId) => {
  const {
    title,
    status,
    priority,
    projectId,
    taskType,
    assignedToIds = [],
  } = data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Validate all assigned users
  if (assignedToIds.length > 0) {
    const memberships = await prisma.projectMembership.findMany({
      where: { projectId, userId: { in: assignedToIds }, leftAt: null },
    });
    if (memberships.length !== assignedToIds.length) {
      throw new AppError(
        "One or more users are not members of this project",
        403,
      );
    }
  }

  // Create task with assignments in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Increment lastTicketNumber
    const updatedProject = await tx.project.update({
      where: { id: projectId },
      data: { lastTicketNumber: { increment: 1 } },
    });

    const task = await tx.task.create({
      data: {
        title,
        ticketNumber: updatedProject.lastTicketNumber,
        status,
        priority,
        taskType: taskType || "TASK",
        projectId,
        createdBy: currentUserId,
      },
    });

    // Create assignments if provided
    if (assignedToIds.length > 0) {
      await tx.taskAssignment.createMany({
        data: assignedToIds.map((userId) => ({
          taskId: task.id,
          userId,
          assignedBy: currentUserId,
        })),
      });
    }

    return task;
  });

  return result;
};


const getTasksByProject = async (projectId, query, currentUserId, userRole) => {
  // Check if user is part of the project (skip for ADMIN)
  if (userRole !== "ADMIN") {
    const isMember = await prisma.projectMembership.findFirst({
      where: {
        projectId: BigInt(projectId),
        userId: currentUserId,
        leftAt: null,
      },
    });

    if (!isMember) {
      throw new AppError("You do not have access to this project", 403);
    }
  }

  const { limit, cursorOption } = getCursorPagination(query);

  const where = {
    deletedAt: null,
    projectId: BigInt(projectId),
    ...(query.status && { status: query.status }),
    ...(userRole === "USER" && {
      assignments: { some: { userId: currentUserId } },
    }),
  };

  const tasks = await prisma.task.findMany({
    ...cursorOption,
    where,
    select: {
      id: true,
      title: true,
      ticketNumber: true,
      status: true,
      priority: true,
      createdAt: true,
      project: { select: { projectKey: true } },
      creator: { select: { name: true } },
      ...(userRole === "ADMIN" && {
        assignments: {
          select: { user: { select: { id: true, name: true } } },
        },
      }),
      timeLogs: {
        select: { duration: true },
      },
    },
  });

  return { tasks, pagination: getCursorPaginationResponse(tasks, limit) };
};

const updateTask = async (role, data, id) => {
  if (!role || !data || !id) {
    throw new AppError("Invalid data", 400);
  }

  const task = await prisma.task.findUnique({
    where: { id, deletedAt: null },
  });

  if (!task) {
    throw new AppError("task not found", 404);
  }

  return await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      priority: data.priority,
      status: data.status,
    },
  });
};

const deleteTask = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id, deletedAt: null },
  });

  if (!task) throw new AppError("Task not found", 404);

  await prisma.$transaction(async (tx) => {
    await tx.timeLog.deleteMany({
      where: { taskId: id },
    });

    await tx.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });

  return { message: "Task deleted successfully" };
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject
};
