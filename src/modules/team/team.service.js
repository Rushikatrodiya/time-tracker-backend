const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

// Get team dashboard with stats, team activity, and active projects
const getTeamDashboard = async (organizationId, userId) => {
  if (!organizationId) {
    throw new AppError("Organization ID is required", 400);
  }

  const userWhere = { organizationId };

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const [totalProjects, teamHoursResult, runningTimers, users, activeProjects] =
    await Promise.all([

      prisma.project.count({
        where: { organizationId },
      }),

      prisma.timeLog.aggregate({
        where: {
          user: { is: userWhere },
          startTime: { gte: todayStart, lt: todayEnd },
          duration: { not: null },
        },
        _sum: { duration: true },
      }),

      prisma.timeLog.count({
        where: {
          user: { is: userWhere },
          endTime: null,
        },
      }),

      prisma.user.findMany({
        where: { ...userWhere, id: { not: userId } },
        select: {
          id: true,
          name: true,
          timeLogs: {
            where: { startTime: { gte: todayStart, lt: todayEnd } },
            select: {
              endTime: true,
              duration: true,
              task: { select: { title: true } },
            },
            orderBy: { startTime: "desc" },
          },
        },
      }),

      prisma.project.findMany({
        where: { organizationId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              memberships: {
                where: {
                  leftAt: null,
                },
              },
            },
          }
        },
      }),
    ]);

  const teamActivity = users.map((user) => {
    const activeLog = user.timeLogs.find((log) => log.endTime === null);
    const hoursToday = user.timeLogs
      .filter((log) => log.duration !== null)
      .reduce((sum, log) => sum + log.duration, 0);

    return {
      id: user.id,
      name: user.name,
      currentTask: activeLog?.task.title ?? null,
      hoursToday,
      isActive: !!activeLog,
    };
  });

  return {
    stats: {
      totalProjects,
      hoursToday: teamHoursResult._sum.duration ?? 0,
      runningTimers,
    },
    teamActivity,
    activeProjects: activeProjects.map((p) => ({
      id: p.id,
      name: p.name,
      taskCount: p._count.tasks,
      memberCount: p._count.memberships,
      status: p.status,
    })),
  };
};

const getUserDashboard = async (userId) => {
  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const [myTasks, completedTasks, hoursTodayResult, assignedTasks] =
    await Promise.all([
      prisma.taskAssignment.count({ where: { userId } }),

      prisma.taskAssignment.count({
        where: { userId, task: { status: "DONE" } },
      }),

      prisma.timeLog.aggregate({
        where: {
          userId,
          startTime: { gte: todayStart, lt: todayEnd },
          duration: { not: null },
        },
        _sum: { duration: true },
      }),

      prisma.taskAssignment.findMany({
        where: { userId },
        select: {
          task: {
            select: {
              id: true,
              title: true,
              ticketNumber: true,
              status: true,
              project: {
                select: { id: true, name: true, projectKey: true },
              },
              _count: false,
              timeLogs: {
                where: { duration: { not: null } },
                select: { duration: true },
              },
            },
          },
        },
      }),
    ]);

  const projectMap = new Map();

  assignedTasks.forEach(({ task }) => {
    const { id, name, projectKey } = task.project;

    if (!projectMap.has(id)) {
      projectMap.set(id, { projectId: id, projectName: name, projectKey, tasks: [] });
    }

    projectMap.get(id).tasks.push({
      id: task.id,
      title: task.title,
      ticketNumber: task.ticketNumber,
      status: task.status,
      hoursLogged: task.timeLogs.reduce((sum, log) => sum + log.duration, 0),
    });
  });

  return {
    stats: {
      myTasks,
      completedTasks,
      hoursToday: hoursTodayResult._sum.duration ?? 0,
    },
    myTasks: Array.from(projectMap.values()),
  };
};

module.exports = {
  getTeamDashboard,
  getUserDashboard,
};
