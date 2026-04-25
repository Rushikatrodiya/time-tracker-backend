const { Router } = require("express");
const {
  getUserProfileController,
  getAllUsersController,
} = require("./user.controllers");
const roleMiddleware = require("../../middlewares/role.middleware");

const router = Router();

router.get("/me", getUserProfileController);
router.get("/", roleMiddleware("MANAGER", "ADMIN"), getAllUsersController);

module.exports = router;
