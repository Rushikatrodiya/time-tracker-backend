const { Resend } = require("resend");
const AppError = require("./AppError");

const getAppName = () => process.env.APP_NAME || "App";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new AppError("RESEND_API_KEY is not configured", 500);
  }
  return new Resend(apiKey);
};

const getFromAddress = () =>
  process.env.EMAIL_FROM || `${getAppName()} <onboarding@resend.dev>`;

const sendEmail = async ({ to, subject, html, replyTo, from }) => {
  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from: from || getFromAddress(),
    to,
    replyTo: replyTo || undefined,
    subject,
    html,
  });

  if (error) {
    throw new AppError(error.message || "Failed to send email", 502);
  }
};

const getInviteUrl = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${frontendUrl}/invitations/accept?token=${token}`;
};

const getInviteEmailHtml = ({ inviteUrl, orgName, inviterName, role }) => `
  <p>Hi,</p>
  <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
  <p><a href="${inviteUrl}">Accept invitation</a></p>
  <p>This link expires in 48 hours. If you did not expect this email, you can ignore it.</p>
`;

const sendInviteEmail = async ({
  to,
  token,
  orgName,
  inviterName,
  role,
  replyTo,
}) => {
  await sendEmail({
    to,
    replyTo,
    subject: `You're invited to join ${orgName} on ${getAppName()}`,
    html: getInviteEmailHtml({
      inviteUrl: getInviteUrl(token),
      orgName,
      inviterName,
      role,
    }),
  });
};

module.exports = { sendEmail, sendInviteEmail };
