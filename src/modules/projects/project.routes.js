const { Router } = require("express");
const {
  createProjectController,
  getAllProjectsController,
} = require("./project.controllers");
const roleMiddleware = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  createProjectSchema,
} = require("./../../validatation/project.validations");

const router = Router();

router.post(
  "/",
  roleMiddleware("MANAGER", "ADMIN"),
  validate(createProjectSchema),
  createProjectController,
);
router.get("/", roleMiddleware("MANAGER", "ADMIN"), getAllProjectsController);

module.exports = router;
