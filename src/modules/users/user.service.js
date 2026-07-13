const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");
const { hashPassword, comparePassword } = require("../../utils/password");

const getAllUsers = async ({ organizationId }) => {
  if (!organizationId) {
    throw new AppError("Organization ID is required", 400);
  }

  const [organization, users] = await Promise.all([
    prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        currency: true,
      },
    }),

    prisma.user.findMany({
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
        hourlyRate: true,
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
    }),
  ]);

  return {
    currency: organization?.currency,
    users,
  };
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

    // Delete the user record
    prisma.user.delete({
      where: { id: BigInt(userIdToRemove) },
    }),
  ]);
};

const updateUserPayroll = async (userId, data, adminOrganizationId) => {
  const { hourlyRate, role } = data;

  const targetUser = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
  });

  if (!targetUser) {
    throw new AppError("User not found", 404);
  }

  if (targetUser.organizationId !== BigInt(adminOrganizationId)) {
    throw new AppError("Forbidden: You can only update users in your organization", 403);
  }

  const updateData = { hourlyRate };
  if (role !== undefined) {
    updateData.role = role;
  }

  const updatedUser = await prisma.user.update({
    where: { id: BigInt(userId) },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      hourlyRate: true,
      organization: {
        select: {
          currency: true
        }
      },
      createdAt: true,
    },
  });

  return updatedUser;
};

const updateOrganizationCurrency = async (orgId, currency, adminOrgId) => {
  // Verify admin is updating their own organization
  if (String(orgId) !== String(adminOrgId)) {
    throw new AppError("Forbidden: You can only update your own organization", 403);
  }

  // Ensure organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: BigInt(orgId) },
    select: { id: true }
  });

  if (!organization) {
    throw new AppError("Organization not found", 404);
  }

  const updatedOrg = await prisma.organization.update({
    where: { id: BigInt(orgId) },
    data: { currency },
    select: { id: true, currency: true }
  });

  return updatedOrg;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  removeUserFromOrganization,
  updateUserPayroll,
  updateOrganizationCurrency,
};
