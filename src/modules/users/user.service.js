const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");
const { hashPassword, comparePassword } = require("../../utils/password");

const getAllUsers = async ({ id, role, organizationId }) => {
  if (!organizationId) {
    throw new AppError("Organization ID is required", 400);
  }
  const users = await prisma.user.findMany({
    where: {
      organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true,
      projectMemberships: {
        select: {
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
              projectKey: true,
            },
          },
        },
      },
    },
  });
  return users;
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const updateUserProfile = async (userId, data) => {
  const { first_name, last_name, email } = data;
  const name = `${first_name} ${last_name}`;

  // check if email is unique if it's being updated
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      id: { not: userId },
    },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name, email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      createdAt: true,
    },
  });

  return updatedUser;
};

const updateUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid current password", 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError("New password cannot be the same as the current password", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters", 400);
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });
};
const removeUserFromOrganization = async (
  userIdToRemove,
  currentUserId,
  currentUserRole,
  organizationId
) => {
  if (String(userIdToRemove) === String(currentUserId)) {
    throw new AppError("You cannot remove yourself from the organization", 400);
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: BigInt(userIdToRemove),
      organizationId: BigInt(organizationId),
    },
    select: { role: true },
  });

  if (!targetUser) {
    throw new AppError("User not found in this organization", 404);
  }

  if (targetUser.role === "ADMIN") {
    throw new AppError("You cannot remove an Admin from the organization", 403);
  }

  await prisma.$transaction([
    // Delete TimeLogs completely
    prisma.timeLog.deleteMany({
      where: { userId: BigInt(userIdToRemove) },
    }),

    // Unassign user from all tasks
    prisma.taskAssignment.deleteMany({
      where: { userId: BigInt(userIdToRemove) },
    }),

    // Remove user from all projects
    prisma.projectMembership.deleteMany({
      where: { userId: BigInt(userIdToRemove) },
    }),

    // Remove pending invitations sent by this user
    prisma.invitation.deleteMany({
      where: { createdBy: BigInt(userIdToRemove) },
    }),

    // Unassign team members if this user was a manager
    prisma.user.updateMany({
      where: { managerId: BigInt(userIdToRemove) },
      data: { managerId: null },
    }),

    // Delete the user record
    prisma.user.delete({
      where: { id: BigInt(userIdToRemove) },
    }),
  ]);
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  removeUserFromOrganization,
};
