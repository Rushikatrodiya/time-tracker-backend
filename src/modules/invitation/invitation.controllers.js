const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");
const {
  createInvitation,
  validateToken,
  acceptInvitation,
  revokeInvitation,
  listInvitations,
} = require("./invitation.service");

const createInvitationController = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { id, name, email: inviterEmail, organizationId } = req.user;

  const invitation = await createInvitation({
    email,
    role,
    orgId: organizationId,
    adminId: id,
    inviterName: name,
    inviterEmail,
  });

  return success(res, invitation, "Invitation sent successfully", 201);
});

const listInvitationsController = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const invitations = await listInvitations(organizationId);
  return success(res, invitations, "Invitations fetched successfully");
});

const revokeInvitationController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.user;

  await revokeInvitation(id, organizationId);
  return success(res, null, "Invitation revoked successfully");
});

const validateTokenController = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const invite = await validateToken(token);

  return success(
    res,
    {
      email: invite.email,
      role: invite.role,
      organizationName: invite.organization.name,
      expiresAt: invite.expiresAt,
    },
    "Invitation is valid",
  );
});

const acceptInvitationController = asyncHandler(async (req, res) => {
  const { token, name, password } = req.body;
  const user = await acceptInvitation(token, name, password);
  return success(res, user, "Invitation accepted successfully", 201);
});

module.exports = {
  createInvitationController,
  listInvitationsController,
  revokeInvitationController,
  validateTokenController,
  acceptInvitationController,
};
