const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

const getTeamSummary = async (organizationId, userRole, userId) => {
  if (!organizationId) {
    throw new AppError("Organization ID is required", 400);
  }

  // CHANGED: Simple managerId filter instead of complex nested query
  let userWhere = { organizationId };
  if (userRole === "MANAGER") {
    userWhere = { managerId: userId };
  }

  // Get team members count
  const teamMembersCount = await prisma.user.count({
    where: {
      ...userWhere,
      id: { not: userId },
    },
  });

  // Today range in UTC
  const today = new Date();
  const todayStart = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const todayEnd = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1),
  );

  // Get total team hours today — CHANGED: returns raw seconds not formatted string
  const teamHoursResult = await prisma.timeLog.aggregate({
    where: {
      user: { is: userWhere }, // CHANGED: correct prisma syntax for relation filter
      startTime: { gte: todayStart, lt: todayEnd },
      duration: { not: null },
    },
    _sum: { duration: true },
  });

  const teamWorksToday = teamHoursResult._sum.duration || 0;

  // Get active users count
  const activeUsers = await prisma.timeLog.findMany({
    where: {
      user: { is: userWhere }, // CHANGED: same fix here
      endTime: null,
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  return {
    teamMembersCount,
    teamWorksToday, // raw seconds — frontend will format this
    activeNowCount: activeUsers.length,
  };
};

// Get detailed team overview
const getTeamOverview = async (organizationId, userRole, userId) => {
  if (!organizationId) {
    throw new AppError("Organization ID is required", 400);
  }

  let userWhere = { organizationId };
  if (userRole === "MANAGER") {
    userWhere = { managerId: userId };
  }

  const today = new Date();
  const todayStart = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const todayEnd = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1),
  );

  const users = await prisma.user.findMany({
    where: { ...userWhere, id: { not: userId } },
    select: {
      id: true,
      name: true,
      role: true,
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
  });

  return users.map((user) => {
    const activeLog = user.timeLogs.find((log) => log.endTime === null);

    const totalSeconds = user.timeLogs
      .filter((log) => log.duration !== null)
      .reduce((sum, log) => sum + log.duration, 0);

    // Status
    let status = "Offline";
    if (activeLog) status = "Active";
    else if (user.timeLogs.length > 0) status = "Idle";

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      status,
      currentTask: activeLog ? activeLog.task.title : null,
      workToday: totalSeconds,
      progress: Math.min(Math.round((totalSeconds / 3600 / 8) * 100), 100),
    };
  });
};

module.exports = {
  getTeamSummary,
  getTeamOverview,
};
