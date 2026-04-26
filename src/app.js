const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const projectRoutes = require("./modules/projects/project.routes");
const taskRoutes = require("./modules/tasks/task.routes");
const timeLogRoutes = require("./modules/timelogs/timelogs.routes");
const teamRoutes = require("./modules/team/team.routes");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middlewares/error.middleware");
const authMiddleware = require("./middlewares/auth.middleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRoutes);
app.use("/users", authMiddleware, userRoutes);
app.use("/projects", authMiddleware, projectRoutes);
app.use("/tasks", authMiddleware, taskRoutes);
app.use("/timelogs", authMiddleware, timeLogRoutes);
app.use("/team", authMiddleware, teamRoutes);

app.use(errorMiddleware);

module.exports = app;
