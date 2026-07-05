const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

const addProjectMember = async (projectId, userId) => {
  const existingMember = await prisma.projectMembership.findFirst({
    where: { projectId, userId, leftAt: null },
  });

  if (existingMember) {
    throw new AppError("User is already a member of this project", 409);
  }

  return prisma.projectMembership.upsert({
    where: {
      projectId_userId: { projectId, userId }
    },
    update: {
      leftAt: null,
      updatedAt: new Date()
    },
    create: {
      projectId,
      userId,
    }
  });
};

const removeProjectMember = async (
  projectId,
  userId,
  currentUserId,
  currentUserRole,
) => {
  if (userId === currentUserId) {
    throw new AppError("You cannot remove yourself from the project", 400);
  }

  const member = await prisma.projectMembership.findFirst({
    where: {
      projectId,
      userId,
      leftAt: null,
    },
  });

  if (!member) {
    throw new AppError("Member not found", 404);
  }

  if (currentUserRole === "MANAGER") {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (targetUser?.role === "ADMIN") {
      throw new AppError(
        "Only Admin can remove Admin from project",
        403
      );
    }
  }

  await prisma.$transaction([
    // Remove all task assignments of this user in the project
    prisma.taskAssignment.deleteMany({
      where: {
        userId,
        task: {
          projectId,
        },
      },
    }),

    // Mark membership as left
    prisma.projectMembership.update({
      where: { id: member.id },
      data: { leftAt: new Date() },
    }),
  ]);

  return { message: "Member removed successfully" };
};

const getProjectMembers = async (projectId) => {
  const members = await prisma.projectMembership.findMany({
    where: { projectId, leftAt: null },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return members;
};

const getFilteredProjectMembers = async (projectId, currentUserId, role) => {
  let userCondition = {};

  if (role === "ADMIN") {
    userCondition = {
      id: { not: BigInt(currentUserId) },
    };
  } else if (role === "MANAGER") {
    userCondition = {
      role: "USER",
    };
  }

  const members = await prisma.projectMembership.findMany({
    where: { 
      projectId: BigInt(projectId), 
      leftAt: null,
      user: userCondition 
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return members;
};

module.exports = {
  addProjectMember,
  removeProjectMember,
  getProjectMembers,
  getFilteredProjectMembers,
};
