const { Router } = require("express");
const roleMiddleware = require("../../middlewares/role.middleware");
const {
  validateSameOrganization,
} = require("../../middlewares/organization.middleware");

const {
  addProjectMemberController,
  removeProjectMemberController,
  getProjectMembersController,
  getFilteredProjectMembersController,
} = require("./project-members.controller");
const validate = require("../../middlewares/validate.middleware");

const {
  addProjectMemberSchema,
} = require("./../../validatation/project-members.validations");

const router = Router();

router.post(
  "/:id",
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
  "/:id",
  roleMiddleware("MANAGER", "ADMIN"),
  getProjectMembersController,
);

router.get(
  "/:id/filtered",
  roleMiddleware("MANAGER", "ADMIN"),
  getFilteredProjectMembersController,
);

module.exports = router;
