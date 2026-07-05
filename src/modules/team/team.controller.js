const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const { getTeamDashboard, getUserDashboard } = require("./team.service");



const getDashboardController = asyncHandler(async (req, res) => {
  const { id: userId, role, organizationId } = req.user;

  const dashboard = role === "USER"
    ? await getUserDashboard(userId)
    : await getTeamDashboard(organizationId, userId);

  return success(res, dashboard, "Dashboard fetched successfully", 200);
});

module.exports = {
  getDashboardController,
};
