const { Router } = require("express");
const {
  createProjectController,
  getAllProjectsController,
} = require("./project.controllers");
const roleMiddleware = require("../../middlewares/role.middleware");

const router = Router();

router.post("/", roleMiddleware("MANAGER", "ADMIN"), createProjectController);
router.get("/", roleMiddleware("MANAGER", "ADMIN"), getAllProjectsController);

module.exports = router;
