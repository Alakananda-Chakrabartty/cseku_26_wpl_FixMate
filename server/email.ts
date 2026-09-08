import crypto from 'crypto';
import nodemailer from 'nodemailer';

export function createEmailVerificationToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export async function sendVerificationEmail(email: string, fullName: string, rawToken: string): Promise<void> {
  const smtpUser = process.env.GMAIL_USER;
  const smtpPassword = process.env.GMAIL_APP_PASSWORD;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  if (!smtpUser || !smtpPassword) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be configured to send verification emails.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPassword },
  });
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;

  await transporter.sendMail({
    from: `FixMate <${smtpUser}>`,
    to: email,
    subject: 'Verify your FixMate email address',
    text: `Hello ${fullName}, verify your FixMate account here: ${verificationUrl}`,
    html: `<p>Hello ${fullName},</p><p><a href="${verificationUrl}">Verify your FixMate email address</a></p><p>This link expires in 24 hours.</p>`,
  });
}
