const { prisma } = require("../config/db");
const AppError = require("../utils/AppError");

const validateSameOrganization = async (req, res, next) => {
  const { userId } = req.body;
  const { id: projectId } = req.params;

  // Get both in parallel (optimized)
  const [project, user] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, organizationId: true },
    }),
  ]);

  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (project.organizationId !== user.organizationId) {
    return next(
      new AppError("User and project must be in same organization", 403),
    );
  }

  req.projectOrgId = project.organizationId;
  next();
};

module.exports = { validateSameOrganization };
