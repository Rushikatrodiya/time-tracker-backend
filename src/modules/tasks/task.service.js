const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

const createTask = async (data) => {
  const { title, status, priority, projectId, assignedTo } = data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (assignedTo) {
    const user = await prisma.user.findUnique({
      where: { id: assignedTo },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      status,
      priority,
      projectId,
      assignedToId: assignedTo,
    },
  });

  return task;
};

const getAllTasks = async () => {
  const tasks = await prisma.task.findMany({
    include: {
      project: {
        select: { id: true, name: true },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return tasks;
};

const updateTask = async (role, data, id) => {
  if (!role || !data || !id) {
    throw new AppError("Invalid data", 400);
  }

  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    throw new AppError("task not found", 404);
  }

  if (role === "USER") {
    if (task.assignedToId !== id) {
      throw new AppError("You are not authorized to update this task", 403);
    }
    return await prisma.task.update({
      where: { id },
      data: { status: data.status },
    });
  }

  if (data.assignedToId) {
    const user = await prisma.user.findUnique({
      where: { id: data.assignedToId },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
  }

  return await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      priority: data.priority,
      status: data.status,
      assignedToId: data?.assignedToId ? data.assignedToId : null,
    },
  });
};

const deleteTask = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) throw new AppError("Task not found", 404);

  return await prisma.task.delete({
    where: { id },
  });
};

module.exports = {
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
};
