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

const getAllTasks = async (query, currentUserId, userRole) => {
  const { limit, cursorOption } = getCursorPagination(query);

  let where = {
    deletedAt: null,
  };
  if (query.status) {
    where.status = query.status;
  }

  if (userRole !== "ADMIN") {
    where.assignments = {
      some: {
        userId: currentUserId,
      },
    };
  }
  const tasks = await prisma.task.findMany({
    ...cursorOption,
    where,
    include: {
      project: {
        select: { id: true, name: true, projectKey: true },
      },
      creator: {
        select: { id: true, name: true },
      },
      timeLogs: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          duration: true,
          title: true,
        },
      },
    },
  });

  return { tasks, pagination: getCursorPaginationResponse(tasks, limit) };
};

const getTaskById = async (id) => {
  const task = await prisma.task.findMany({
    where: { id, deletedAt: null },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task) throw new AppError("Task not found", 404);
  return task;
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

  return await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

module.exports = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getTaskById,
};
