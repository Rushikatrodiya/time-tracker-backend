const { Router } = require("express");
const roleMiddleware = require("../../middlewares/role.middleware");
const {
  getTeamSummaryController,
  getTeamOverviewController,
} = require("./team.controller");

const router = Router();

// Team summary endpoint - ADMIN and MANAGER only
router.get(
  "/summary",
  roleMiddleware("ADMIN", "MANAGER"),
  getTeamSummaryController,
);

// Team overview endpoint - ADMIN and MANAGER only
router.get(
  "/overview",
  roleMiddleware("ADMIN", "MANAGER"),
  getTeamOverviewController,
);

module.exports = router;
