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
      title: task.title,
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
    (endTime - new Date(activeTime.startTime)) / 1000,
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

const getTaskTimeLogs = async (userId, taskId) => {
  const [timeLogs, totalDurationResult] = await Promise.all([
    prisma.timeLog.findMany({
      where: {
        taskId,
        userId,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        title: true,
      },
    }),
    prisma.timeLog.aggregate({
      where: {
        taskId,
        userId,
        duration: { not: null },
      },
      _sum: {
        duration: true,
      },
    }),
  ]);

  return {
    timeLogs,
    totalDuration: totalDurationResult._sum.duration || 0,
  };
};

const getAllTasksTotalDuration = async (userId) => {
  // Get completed tasks with total durations
  const completedResults = await prisma.timeLog.groupBy({
    by: ["taskId"],
    where: {
      userId,
      endTime: { not: null },
      duration: { not: null },
    },
    _sum: {
      duration: true,
    },
  });

  // Get active timer (if any)
  const activeTimer = await prisma.timeLog.findFirst({
    where: {
      userId,
      endTime: null,
    },
    include: {
      task: {
        select: { id: true, title: true },
      },
    },
  });

  // Format completed tasks
  const tasksWithDurations = completedResults.map((result) => ({
    taskId: result.taskId,
    totalDuration: result._sum.duration || 0,
  }));

  // Add active timer info if exists
  if (activeTimer) {
    // Add or update the task with active timer info
    const existingTaskIndex = tasksWithDurations.findIndex(
      (task) => task.taskId === activeTimer.taskId,
    );

    const taskWithActiveTimer = {
      taskId: activeTimer.taskId,
      totalDuration:
        existingTaskIndex >= 0
          ? tasksWithDurations[existingTaskIndex].totalDuration
          : 0,
      activeTimer: {
        id: activeTimer.id,
        startTime: activeTimer.startTime,
        task: activeTimer.task,
      },
    };

    if (existingTaskIndex >= 0) {
      tasksWithDurations[existingTaskIndex] = taskWithActiveTimer;
    } else {
      tasksWithDurations.push(taskWithActiveTimer);
    }
  }

  return {
    tasks: tasksWithDurations,
    hasActiveTimer: !!activeTimer,
  };
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

const upateTaskTimeLog = async (
  timeLogId,
  userId,
  taskId,
  startTime,
  endTime,
  title,
) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // 1. basic rule
  if (start >= end) {
    throw new AppError("Start time must be before end time", 400);
  }

  // 2. check assignment
  const assignment = await prisma.taskAssignment.findFirst({
    where: { userId, taskId },
  });

  if (!assignment) {
    throw new AppError("Not assigned to this task", 403);
  }

  // 3. check overlap (exclude current log)
  const overlap = await prisma.timeLog.findFirst({
    where: {
      userId,
      taskId,
      id: { not: timeLogId }, // 🔥 VERY IMPORTANT
      endTime: { not: null },
      AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
    },
  });

  if (overlap) {
    throw new AppError("Time overlaps with existing log", 409);
  }

  // 4. duration
  const duration = Math.floor((end - start) / 1000);

  // 5. update log
  await prisma.timeLog.update({
    where: { id: timeLogId },
    data: {
      startTime: start,
      endTime: end,
      duration,
      title,
    },
  });

  // 6. get updated timelog and total duration only
  const [updatedTimeLog, total] = await Promise.all([
    prisma.timeLog.findUnique({
      where: { id: timeLogId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        title: true,
      },
    }),
    prisma.timeLog.aggregate({
      where: { userId, taskId },
      _sum: { duration: true },
    }),
  ]);

  return {
    timeLog: updatedTimeLog,
    totalDuration: total._sum.duration || 0,
  };
};

const deleteTimeLog = async (timeLogId) => {
  const timeLog = await prisma.timeLog.findUnique({
    where: { id: timeLogId },
  });
  if (!timeLog) {
    throw new AppError("Time log not found", 404);
  }

  const assignment = await prisma.taskAssignment.findFirst({
    where: { userId: timeLog.userId, taskId: timeLog.taskId },
  });

  if (!assignment) {
    throw new AppError("Not assigned to this task", 403);
  }

  await prisma.timeLog.delete({
    where: { id: timeLogId },
  });

  const total = await prisma.timeLog.aggregate({
    where: { userId: timeLog.userId, taskId: timeLog.taskId },
    _sum: { duration: true },
  });

  return total._sum.duration || 0;
};

module.exports = {
  startTimer,
  endTime,
  getAllTimelogs,
  getTaskTimeLogs,
  getAllTasksTotalDuration,
  upateTaskTimeLog,
  deleteTimeLog,
};
