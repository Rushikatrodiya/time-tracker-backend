const { Router } = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const { getUserProfileController } = require("./user.controllers");

const router = Router();

router.get("/me", authMiddleware, getUserProfileController);

module.exports = router;
