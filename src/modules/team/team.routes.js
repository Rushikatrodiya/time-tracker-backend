const { Router } = require("express");
const roleMiddleware = require("../../middlewares/role.middleware");
const {
  getDashboardController,
} = require("./team.controller");

const router = Router();

// Team dashboard endpoint - ADMIN and MANAGER only
router.get("/dashboard", getDashboardController);

module.exports = router;
