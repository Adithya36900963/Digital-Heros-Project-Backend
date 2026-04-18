import crypto from 'crypto';
import { env } from '../config/env.js';
import { sendEmail } from './emailService.js';

const VERIFICATION_TTL_HOURS = 24;

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashEmailVerificationToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function sendVerificationEmail(user, token) {
  const verifyUrl = `${env.clientUrl.replace(/\/$/, '')}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your Digital Heroes email',
    text: `Verify your Digital Heroes account: ${verifyUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#171715">
        <h2>Verify your Digital Heroes email</h2>
        <p>Confirm your email address to unlock your dashboard, subscription, scores, and draw access.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;background:#00796b;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify email</a></p>
        <p>If the button does not work, copy this link:</p>
        <p>${verifyUrl}</p>
        <p>This link expires in ${VERIFICATION_TTL_HOURS} hours.</p>
      </div>
    `
  });
}
