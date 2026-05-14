const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const { getAllUsers } = require("./user.service");

const getUserProfileController = (req, res) => {
  return success(res, req.user, "User profile fetched successfully", 200);
};

const getAllUsersController = asyncHandler(async (req, res) => {
  const { id, role, organizationId } = req.user;
  const users = await getAllUsers({ id, role, organizationId });
  return success(res, users, "Users fetched successfully", 200);
});

module.exports = {
  getUserProfileController,
  getAllUsersController,
};
