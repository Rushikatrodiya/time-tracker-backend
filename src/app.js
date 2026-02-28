const express = require("express");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const projectRoutes = require("./modules/projects/project.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const taskRoutes = require("./modules/tasks/task.routes");
const cookieParser = require("cookie-parser");
const authMiddleware = require("./middlewares/auth.middleware");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/projects", authMiddleware, projectRoutes);
app.use("/tasks", authMiddleware, taskRoutes);

app.use(errorMiddleware);

module.exports = app;
