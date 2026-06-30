const { Router } = require("express");
const {
  createProjectController,
  getAllProjectsController,
  updateProjectController,
  deleteProjectController,
  getSimpleProjectListController,
} = require("./project.controllers");
const roleMiddleware = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("./../../validatation/project.validations");

const router = Router();

router.post(
  "/",
  roleMiddleware("ADMIN"),
  validate(createProjectSchema),
  createProjectController,
);
router.get("/list", getSimpleProjectListController);
router.get("/", roleMiddleware("MANAGER", "ADMIN"), getAllProjectsController);
router.patch(
  "/:id",
  roleMiddleware("MANAGER", "ADMIN"),
  validate(updateProjectSchema),
  updateProjectController,
);
router.delete("/:id", roleMiddleware("ADMIN"), deleteProjectController);

module.exports = router;
