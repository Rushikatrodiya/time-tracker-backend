const crypto = require("crypto");
const { prisma } = require("../../config/db");
const AppError = require("../../utils/AppError");
const { hashPassword } = require("../../utils/password");
const { sendInviteEmail } = require("../../utils/email");

const createInvitation = async ({
    email,
    role,
    orgId,
    adminId,
    inviterName,
    inviterEmail,
}) => {
    const existing = await prisma.user.findFirst({
        where: { email, organizationId: orgId },
    });
    if (existing) {
        throw new AppError("User already exists in this organization", 400);
    }

    const pending = await prisma.invitation.findFirst({
        where: { email, orgId, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pending) {
        throw new AppError("Invite already sent to this email", 400);
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invitation = await prisma.invitation.create({
        data: {
            email,
            role,
            orgId: BigInt(orgId),
            createdBy: BigInt(adminId),
            token,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
        include: {
            organization: { select: { name: true } },
        },
    });

    try {
        await sendInviteEmail({
            to: email,
            token,
            orgName: invitation.organization.name,
            inviterName,
            role,
            replyTo: inviterEmail,
        });
    } catch (err) {
        await prisma.invitation.delete({ where: { id: invitation.id } });
        throw err;
    }

    const { organization, ...result } = invitation;
    return result;
};

const validateToken = async (token) => {
    const invite = await prisma.invitation.findUnique({
        where: { token },
        include: { organization: { select: { name: true } } },
    });
    if (!invite) throw new AppError("Invalid invite token", 400);
    if (invite.usedAt) throw new AppError("Invite already used", 400);
    if (invite.expiresAt < new Date()) throw new AppError("Invite expired", 400);
    return invite;
};

const acceptInvitation = async (token, name, password) => {
    const invite = await validateToken(token);

    const existingUser = await prisma.user.findUnique({
        where: { email: invite.email },
    });
    if (existingUser) {
        throw new AppError("An account with this email already exists", 400);
    }

    const hashed = await hashPassword(password);

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name,
                email: invite.email,
                password: hashed,
                role: invite.role,
                organizationId: invite.orgId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                organizationId: true,
                createdAt: true,
            },
        });
        await tx.invitation.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
        });
        return user;
    });
};

const revokeInvitation = async (inviteId, orgId) => {
    const invite = await prisma.invitation.findFirst({
        where: { id: BigInt(inviteId), orgId: BigInt(orgId) },
    });
    if (!invite) throw new AppError("Invite not found", 404);
    if (invite.usedAt) throw new AppError("Cannot revoke a used invite", 400);
    await prisma.invitation.delete({ where: { id: BigInt(inviteId) } });
};

const listInvitations = async (orgId) => {
    return prisma.invitation.findMany({
        where: { orgId: BigInt(orgId) },
        orderBy: { expiresAt: "desc" },
        select: {
            id: true,
            email: true,
            role: true,
            expiresAt: true,
            usedAt: true,
        },
    });
};

module.exports = {
    createInvitation,
    validateToken,
    acceptInvitation,
    revokeInvitation,
    listInvitations,
};
