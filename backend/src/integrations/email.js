import nodemailer from "nodemailer";

import { ServiceError } from "../services/serviceError.js";

function getEmailConfiguration() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !user || !password || !from) {
    throw new ServiceError(500, "Email service is not configured on the server");
  }

  return { host, port, user, password, from };
}

function createEmailTransporter(configuration) {
  return nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.port === 465,
    auth: {
      user: configuration.user,
      pass: configuration.password,
    },
  });
}

export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const configuration = getEmailConfiguration();
  const transporter = createEmailTransporter(configuration);

  await transporter.sendMail({
    from: `Feedback Hub <${configuration.from}>`,
    to: email,
    subject: "Reset your Feedback Hub password",
    text: `Hi ${name || "there"},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 15 minutes and can be used only once. If you did not request this, you can ignore this email.`,
    html: `
      <p>Hi ${name || "there"},</p>
      <p>Use the link below to reset your Feedback Hub password:</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 15 minutes and can be used only once.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
}
