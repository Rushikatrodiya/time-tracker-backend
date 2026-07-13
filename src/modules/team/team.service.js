const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

// Helper to get standard date ranges
const getDateRanges = () => {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const monthEnd = new Date();
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 1);
  monthEnd.setUTCHours(0, 0, 0, 0);

  return { todayStart, todayEnd, monthStart, monthEnd };
};

// Helper to create a promise for aggregating time log durations
const getDurationSumPromise = (baseWhere, gte, lt) => {
  return prisma.timeLog.aggregate({
    where: {
      ...baseWhere,
      startTime: { gte, lt },
      duration: { not: null },
    },
    _sum: { duration: true },
  });
};

// Get team dashboard with stats, team activity, and active projects
// Get team dashboard with stats, team activity, and active projects
const getTeamDashboard = async (organizationId, userId) => {
  if (!organizationId) {
    throw new AppError("Organization ID is required", 400);
  }

  const userWhere = { organizationId };
  const { todayStart, todayEnd, monthStart, monthEnd } = getDateRanges();
  const timeLogWhere = { user: { is: userWhere } };

  const [totalProjects, teamHoursResult, teamMonthHoursResult, runningTimers, users, activeProjects, currenyForOrganization, projectTimeLogs] =
    await Promise.all([
      prisma.project.count({
        where: { organizationId },
      }),

      getDurationSumPromise(timeLogWhere, todayStart, todayEnd),
      getDurationSumPromise(timeLogWhere, monthStart, monthEnd),

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
          hourlyRate: true,
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
              tasks: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      }),

      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { currency: true },
      }),

      // Fetch this month's time logs for active projects, along with each user's hourlyRate,
      // so we can compute a per-project cost without an N+1 query.
      prisma.timeLog.findMany({
        where: {
          startTime: { gte: monthStart, lt: monthEnd },
          duration: { not: null },
          task: {
            project: { organizationId, status: "ACTIVE" },
          },
        },
        select: {
          duration: true,
          task: { select: { projectId: true } },
          user: { select: { hourlyRate: true } },
        },
      }),
    ]);

  const teamActivity = users.map((user) => {
    const activeLog = user.timeLogs.find((log) => log.endTime === null);
    const hoursToday = user.timeLogs
      .filter((log) => log.duration !== null)
      .reduce((sum, log) => sum + log.duration, 0);

    // costToday is null if no hourlyRate set, otherwise compute today's cost
    const costToday =
      user.hourlyRate !== null
        ? Math.round((hoursToday / 3600) * user.hourlyRate * 100) / 100
        : null;

    return {
      id: user.id,
      name: user.name,
      currentTask: activeLog?.task.title ?? null,
      hoursToday,
      isActive: !!activeLog,
      hourlyRate: user.hourlyRate,
      costToday,
    };
  });

  // Calculate team cost based on hourly rates
  const usersWithRate = users.filter((u) => u.hourlyRate !== null);
  let teamCost = null;

  if (usersWithRate.length > 0) {
    const userIds = usersWithRate.map((u) => BigInt(u.id));

    // Single grouped query instead of one aggregate per user (fixes N+1)
    const monthAggregates = await prisma.timeLog.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        startTime: { gte: monthStart, lt: monthEnd },
        duration: { not: null },
      },
      _sum: { duration: true },
    });

    // Map userId -> summed duration (seconds) for quick lookup
    const durationByUserId = new Map(
      monthAggregates.map((agg) => [agg.userId.toString(), agg._sum.duration ?? 0])
    );

    const cost = usersWithRate.reduce((sum, u) => {
      const duration = durationByUserId.get(u.id.toString()) ?? 0;
      const hours = duration / 3600; // duration is stored in seconds -> convert to hours
      return sum + hours * (u.hourlyRate ?? 0);
    }, 0);


    teamCost = Math.round(cost * 100) / 100;
  }

  const ratedUsersCount = usersWithRate.length;
  const totalUsersCount = users.length;

  // Build a projectId -> cost map from projectTimeLogs (skip logs from users with no hourlyRate)
  const costByProjectId = new Map();
  projectTimeLogs.forEach((log) => {
    if (log.user.hourlyRate === null) return;
    const projectId = log.task.projectId;
    const hours = (log.duration ?? 0) / 3600;
    const cost = hours * log.user.hourlyRate;
    costByProjectId.set(projectId, (costByProjectId.get(projectId) ?? 0) + cost);
  });

  return {
    stats: {
      totalProjects,
      hoursToday: teamHoursResult._sum.duration ?? 0,
      hoursThisMonth: teamMonthHoursResult._sum.duration ?? 0,
      runningTimers,
      teamCost,
      ratedUsersCount,
      totalUsersCount,
      currency: currenyForOrganization?.currency
    },
    teamActivity,
    activeProjects: activeProjects.map((p) => ({
      id: p.id,
      name: p.name,
      taskCount: p._count.tasks,
      memberCount: p._count.memberships,
      status: p.status,
      cost: Math.round((costByProjectId.get(p.id) ?? 0) * 100) / 100,
    })),
  };
};

const getUserDashboard = async (userId) => {
  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const { todayStart, todayEnd, monthStart, monthEnd } = getDateRanges();
  const timeLogWhere = { userId };

  const [myTasks, completedTasks, hoursTodayResult, hoursThisMonthResult, assignedTasks, currentUser] =
    await Promise.all([
      prisma.taskAssignment.count({ where: { userId } }),

      prisma.taskAssignment.count({
        where: { userId, task: { status: "DONE" } },
      }),

      getDurationSumPromise(timeLogWhere, todayStart, todayEnd),
      getDurationSumPromise(timeLogWhere, monthStart, monthEnd),

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

      prisma.user.findUnique({
        where: { id: userId },
        select: {
          hourlyRate: true,
          organization: {
            select: {
              currency: true
            }
          }
        }
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

  // Only calculate cost if this user has an hourlyRate set
  let myCost = null;
  if (currentUser?.hourlyRate !== null && currentUser?.hourlyRate !== undefined) {
    const monthDurationSeconds = hoursThisMonthResult._sum.duration ?? 0;
    const hours = monthDurationSeconds / 3600; // seconds -> hours
    myCost = Math.round(hours * currentUser.hourlyRate * 100) / 100;
  }

  return {
    stats: {
      myTasks,
      completedTasks,
      hoursToday: hoursTodayResult._sum.duration ?? 0,
      hoursThisMonth: hoursThisMonthResult._sum.duration ?? 0,
      myCost,
      currency: currentUser?.organization?.currency
    },
    myTasks: Array.from(projectMap.values()),
  };
};

module.exports = {
  getTeamDashboard,
  getUserDashboard,
};
