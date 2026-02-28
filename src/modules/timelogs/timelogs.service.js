const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

const startTimer = async (userId, taskId) => {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  const activeTimer = await prisma.timeLog.findFirst({
    where: {
      userId,
      endTime: null,
    },
  });
  if (activeTimer) {
    throw new AppError("Timer is already running", 400);
  }

  const timeLog = await prisma.timeLog.create({
    data: {
      userId,
      taskId,
    },
  });

  return timeLog;
};

const endTime = async (userId) => {
  const activeTime = await prisma.timeLog.findFirst({
    where: {
      userId,
      endTime: null,
    },
  });
  if (!activeTime) throw new AppError("No active timer found", 404);

  const endTime = new Date();
  const duration = Math.round(
    (endTime - new Date(activeTime.startTime)) / 1000 / 60,
  );

  const timeLog = await prisma.timeLog.update({
    where: {
      id: activeTime.id,
    },
    data: {
      endTime,
      duration,
    },
  });
  return timeLog;
};

const getAllTimelogs = async (user) => {
  let where = {};

  if (user.role !== "ADMIN") {
    where = {
      userId: user.id,
    };
  }

  return await prisma.timeLog.findMany({
    where,
    include: {
      task: {
        select: { id: true, title: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

module.exports = {
  startTimer,
  endTime,
  getAllTimelogs,
};
