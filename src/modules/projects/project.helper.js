const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");

async function assertProjectIsActive(projectId) {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    if (project.status !== 'ACTIVE') {
        throw new AppError('Cannot modify resources in an archived project', 400);
    }

    return project;
}

module.exports = { assertProjectIsActive };
