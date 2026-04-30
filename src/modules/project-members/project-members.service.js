const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

const addProjectMember = async (projectId, userId) => {
  // Check if already a member
  const existingMember = await prisma.projectMembership.findFirst({
    where: { projectId, userId },
  });

  if (existingMember) {
    throw new AppError("User is already a member of this project", 409);
  }

  // Add member
  const member = await prisma.projectMembership.create({
    data: {
      projectId,
      userId,
    },
  });

  return member;
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
    where: { projectId, userId },
  });

  if (!member) {
    throw new AppError("Member not found", 404);
  }

  if (currentUserRole === "MANAGER") {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (targetUser.role === "ADMIN") {
      throw new AppError("Only Admin can remove Admin from project", 403);
    }
  }

  await prisma.projectMembership.delete({
    where: { id: member.id },
  });

  return { message: "Member removed successfully" };
};

const getProjectMembers = async (projectId) => {
  const members = await prisma.projectMembership.findMany({
    where: { projectId },
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
};
