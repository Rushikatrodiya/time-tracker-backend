const { Router } = require("express");
const {
  createInvitationController,
  listInvitationsController,
  revokeInvitationController,
  validateTokenController,
  acceptInvitationController,
} = require("./invitation.controllers");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  createInvitationSchema,
  acceptInvitationSchema,
} = require("../../validatation/invitation.validations");

const router = Router();

router.get("/validate/:token", validateTokenController);
router.post(
  "/accept",
  validate(acceptInvitationSchema),
  acceptInvitationController,
);

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware("ADMIN"),
  validate(createInvitationSchema),
  createInvitationController,
);
router.get("/", roleMiddleware("ADMIN"), listInvitationsController);
router.delete("/:id", roleMiddleware("ADMIN"), revokeInvitationController);

module.exports = router;
