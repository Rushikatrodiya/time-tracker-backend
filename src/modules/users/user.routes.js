const { Router } = require("express");
const {
  getUserProfileController,
  getAllUsersController,
  updateUserProfileController,
  updateUserPasswordController,
  removeUserController,
  updateUserPayrollController,
  updateOrganizationCurrencyController,
} = require("./user.controllers");
const roleMiddleware = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  updateProfileSchema,
  updatePasswordSchema,
  updatePayrollSchema,
  updateOrganizationCurrencySchema,
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

router.patch(
  "/:id",
  roleMiddleware("ADMIN"),
  validate(updatePayrollSchema),
  updateUserPayrollController
);

router.patch(
  "/:id/organization",
  roleMiddleware("ADMIN"),
  validate(updateOrganizationCurrencySchema),
  updateOrganizationCurrencyController
);

module.exports = router;
