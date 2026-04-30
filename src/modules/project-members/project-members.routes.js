const { Router } = require("express");
const roleMiddleware = require("../../middlewares/role.middleware");
const {
  validateSameOrganization,
} = require("../../middlewares/organization.middleware");

const {
  addProjectMemberController,
  removeProjectMemberController,
  getProjectMembersController,
} = require("./project-members.controller");
const validate = require("../../middlewares/validate.middleware");

const {
  addProjectMemberSchema,
} = require("./../../validatation/project-members.validations");

const router = Router();

router.post(
  "/:id/members",
  roleMiddleware("MANAGER", "ADMIN"),
  validateSameOrganization,
  validate(addProjectMemberSchema),
  addProjectMemberController,
);

router.delete(
  "/:id/members/:userId",
  roleMiddleware("MANAGER", "ADMIN"),
  removeProjectMemberController,
);

router.get(
  "/:id/members",
  roleMiddleware("MANAGER", "ADMIN"),
  getProjectMembersController,
);

module.exports = router;
