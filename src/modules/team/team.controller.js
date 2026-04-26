const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const { getTeamSummary, getTeamOverview } = require("./team.service");

const getTeamSummaryController = asyncHandler(async (req, res) => {
  const { id: userId, role, organizationId } = req.user;

  const summary = await getTeamSummary(organizationId, role, userId);
  return success(res, summary, "Team summary fetched successfully", 200);
});

const getTeamOverviewController = asyncHandler(async (req, res) => {
  const { id: userId, role, organizationId } = req.user;

  const overview = await getTeamOverview(organizationId, role, userId);
  return success(res, overview, "Team overview fetched successfully", 200);
});

module.exports = {
  getTeamSummaryController,
  getTeamOverviewController,
};
