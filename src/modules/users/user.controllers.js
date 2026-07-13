const asyncHandler = require("../../utils/asyncHandler");
const { success, error } = require("../../utils/response");
const { getAllUsers, getUserById, updateUserProfile, updateUserPassword, removeUserFromOrganization, updateUserPayroll, updateOrganizationCurrency } = require("./user.service");

const getUserProfileController = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  return success(res, user, "User profile fetched successfully", 200);
});

const getAllUsersController = asyncHandler(async (req, res) => {
  const { id, role, organizationId } = req.user;
  const users = await getAllUsers({ id, role, organizationId });
  return success(res, users, "Users fetched successfully", 200);
});


const updateUserProfileController = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const tokenUserId = req.user.id;

  if (userId !== String(tokenUserId)) {
    return error(res, "Forbidden: You can only update your own profile", 403);
  }

  const updatedUser = await updateUserProfile(BigInt(userId), req.body);
  return success(res, updatedUser, "Profile updated successfully", 200);
});

const updateUserPasswordController = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const tokenUserId = req.user.id;

  if (userId !== String(tokenUserId)) {
    return error(res, "Forbidden: You can only update your own password", 403);
  }

  const { current_password, new_password } = req.body;
  await updateUserPassword(BigInt(userId), current_password, new_password);

  return success(res, null, "Password updated successfully", 200);
});

const removeUserController = asyncHandler(async (req, res) => {
  const userIdToRemove = req.params.id;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;
  const organizationId = req.user.organizationId;

  await removeUserFromOrganization(
    userIdToRemove,
    currentUserId,
    currentUserRole,
    organizationId
  );

  return success(res, null, "User removed successfully", 200);
});

const updateUserPayrollController = asyncHandler(async (req, res) => {
  const userIdToUpdate = req.params.id;
  const { hourlyRate, role } = req.body;
  const adminOrganizationId = req.user.organizationId;

  const updatedUser = await updateUserPayroll(
    userIdToUpdate,
    { hourlyRate, role },
    adminOrganizationId
  );

  return success(res, updatedUser, "Payroll settings updated successfully", 200);
});

const updateOrganizationCurrencyController = asyncHandler(async (req, res) => {
  const orgIdToUpdate = req.params.id;
  const adminOrganizationId = req.user.organizationId;
  const { currency } = req.body;

  const updatedOrg = await updateOrganizationCurrency(orgIdToUpdate, currency, adminOrganizationId);

  return success(res, updatedOrg, "Organization currency updated successfully", 200);
});

module.exports = {
  getUserProfileController,
  getAllUsersController,
  updateUserProfileController,
  updateUserPasswordController,
  removeUserController,
  updateUserPayrollController,
  updateOrganizationCurrencyController,
};
