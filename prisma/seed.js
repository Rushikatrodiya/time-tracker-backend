const { PrismaClient, Role, ProjectStatus, TaskStatus, TaskType } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("Test@1234", 10);

    // ─── 1. ORGANIZATION ──────────────────────────────────────────────────────
    const org = await prisma.organization.create({
        data: { name: "Acme Corp" },
    });

    // ─── 2. USERS ─────────────────────────────────────────────────────────────
    const admin = await prisma.user.create({
        data: {
            name: "Alice Admin",
            email: "admin@acme.com",
            password,
            role: Role.ADMIN,
            organizationId: org.id,
        },
    });

    const manager = await prisma.user.create({
        data: {
            name: "Bob Manager",
            email: "manager@acme.com",
            password,
            role: Role.MANAGER,
            organizationId: org.id,
        },
    });

    const [carol, dan, eve] = await Promise.all(
        [
            { name: "Carol Dev", email: "carol@acme.com" },
            { name: "Dan Design", email: "dan@acme.com" },
            { name: "Eve QA", email: "eve@acme.com" },
        ].map((u) =>
            prisma.user.create({
                data: {
                    ...u,
                    password,
                    role: Role.USER,
                    organizationId: org.id,
                },
            })
        )
    );

    // ─── 3. PROJECTS ──────────────────────────────────────────────────────────
    const repurpose = await prisma.project.create({
        data: {
            name: "Repurpose.io",
            description: "Content repurposing platform",
            projectKey: "REPR",
            status: ProjectStatus.ACTIVE,
            lastTicketNumber: 0,
            organizationId: org.id,
            ownerId: manager.id,
        },
    });

    const internal = await prisma.project.create({
        data: {
            name: "Internal Tools",
            description: "Internal tooling and automation",
            projectKey: "INT",
            status: ProjectStatus.ACTIVE,
            lastTicketNumber: 0,
            organizationId: org.id,
            ownerId: admin.id,
        },
    });

    // ─── 4. PROJECT MEMBERSHIPS ───────────────────────────────────────────────
    await prisma.projectMembership.createMany({
        data: [manager, carol, dan, eve].map((u) => ({
            projectId: repurpose.id,
            userId: u.id,
        })),
    });

    await prisma.projectMembership.createMany({
        data: [admin, manager, carol].map((u) => ({
            projectId: internal.id,
            userId: u.id,
        })),
    });

    // ─── 5. TASKS ─────────────────────────────────────────────────────────────
    const taskDefs = [
        { title: "Setup project scaffolding", status: TaskStatus.DONE, type: TaskType.TASK, priority: 1, assignee: carol },
        { title: "Design system wireframes", status: TaskStatus.DONE, type: TaskType.FEAT, priority: 2, assignee: dan },
        { title: "Auth module — login/register", status: TaskStatus.DONE, type: TaskType.FEAT, priority: 1, assignee: carol },
        { title: "Fix navbar z-index bug", status: TaskStatus.DONE, type: TaskType.BUG, priority: 2, assignee: dan },
        { title: "Dashboard stats API", status: TaskStatus.IN_PROGRESS, type: TaskType.FEAT, priority: 1, assignee: carol },
        { title: "Task list UI", status: TaskStatus.IN_PROGRESS, type: TaskType.FEAT, priority: 2, assignee: dan },
        { title: "Time log start/stop", status: TaskStatus.IN_PROGRESS, type: TaskType.FEAT, priority: 1, assignee: eve },
        { title: "Improve query performance", status: TaskStatus.TODO, type: TaskType.IMPR, priority: 3, assignee: carol },
        { title: "Write unit tests", status: TaskStatus.TODO, type: TaskType.TASK, priority: 2, assignee: eve },
        { title: "Role-based route guards", status: TaskStatus.TODO, type: TaskType.FEAT, priority: 1, assignee: carol },
    ];

    const tasks = await Promise.all(
        taskDefs.map((t, i) =>
            prisma.task.create({
                data: {
                    title: t.title,
                    ticketNumber: i + 1,
                    status: t.status,
                    taskType: t.type,
                    priority: t.priority,
                    projectId: repurpose.id,
                    createdBy: manager.id,
                    assignments: {
                        create: {
                            userId: t.assignee.id,
                            assignedBy: manager.id,
                        },
                    },
                },
            })
        )
    );

    await prisma.project.update({
        where: { id: repurpose.id },
        data: { lastTicketNumber: tasks.length },
    });

    // ─── 6. TIME LOGS ─────────────────────────────────────────────────────────
    const now = new Date();
    const daysAgo = (d, h = 9, m = 0) => {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(h, m, 0, 0);
        return date;
    };

    const timeLogDefs = [
        { task: tasks[0], user: carol, start: daysAgo(10, 9), end: daysAgo(10, 10, 30) },
        { task: tasks[0], user: carol, start: daysAgo(9, 14), end: daysAgo(9, 15, 45) },
        { task: tasks[1], user: dan, start: daysAgo(8, 10), end: daysAgo(8, 12) },
        { task: tasks[1], user: dan, start: daysAgo(7, 13), end: daysAgo(7, 15, 30) },
        { task: tasks[2], user: carol, start: daysAgo(6, 9), end: daysAgo(6, 11) },
        { task: tasks[3], user: dan, start: daysAgo(5, 11), end: daysAgo(5, 12) },
        { task: tasks[4], user: carol, start: daysAgo(3, 9), end: daysAgo(3, 10, 30) },
        { task: tasks[4], user: carol, start: daysAgo(1, 9), end: daysAgo(1, 11) },
        { task: tasks[5], user: dan, start: daysAgo(2, 10), end: daysAgo(2, 12, 30) },
        { task: tasks[6], user: eve, start: daysAgo(1, 13), end: daysAgo(1, 14, 12) },
        // active log — no endTime, simulates currently running timer
        { task: tasks[6], user: eve, start: daysAgo(0, 9), end: null },
    ];

    await Promise.all(
        timeLogDefs.map(({ task, user, start, end }) => {
            const duration = end
                ? Math.floor((end.getTime() - start.getTime()) / 1000)
                : null;
            return prisma.timeLog.create({
                data: {
                    taskId: task.id,
                    userId: user.id,
                    startTime: start,
                    endTime: end ?? undefined,
                    duration,
                    title: task.title,
                },
            });
        })
    );

    console.log("✅ Seed complete");
    console.log("─────────────────────────────────────────");
    console.log("  Org    : Acme Corp");
    console.log("  Admin  : admin@acme.com    / Test@1234");
    console.log("  Manager: manager@acme.com  / Test@1234");
    console.log("  Users  : carol@acme.com, dan@acme.com, eve@acme.com  / Test@1234");
    console.log("  Tasks  : 10 (TODO / IN_PROGRESS / DONE)");
    console.log("  Logs   : 11 (1 active — no endTime)");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());