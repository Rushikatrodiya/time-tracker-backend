const { Router } = require("express");
const {
  signUpController,
  signInController,
  signOutController,
  refreshController,
} = require("./auth.controllers");

const router = Router();

router.post("/register", signUpController);
router.post("/login", signInController);
router.post("/signout", signOutController);
router.post("/refresh", refreshController);

module.exports = router;
