const { Router } = require("express");
const {
  getUserProfileController,
  getAllUsersController,
  updateUserProfileController,
  updateUserPasswordController,
  removeUserController,
} = require("./user.controllers");
const roleMiddleware = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  updateProfileSchema,
  updatePasswordSchema,
} = require("../../validatation/user.validations");

const router = Router();

router.get("/me", getUserProfileController);
router.get("/", roleMiddleware("MANAGER", "ADMIN"), getAllUsersController);

router.patch(
  "/:id/profile",
  validate(updateProfileSchema),
  updateUserProfileController
);

router.patch(
  "/:id/password",
  validate(updatePasswordSchema),
  updateUserPasswordController
);

router.delete("/:id", roleMiddleware("ADMIN"), removeUserController);

module.exports = router;
