/* ──────────────────────────────────────────
   Nodemailer transporter (singleton)
   ────────────────────────────────────────── */
import nodemailer, { Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { trackIntegration } from "@/lib/integration-logger";

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST(),
      port: env.SMTP_PORT(),
      secure: env.SMTP_SECURE(), // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER(),
        pass: env.SMTP_PASS(),
      },
    });
  }
  return transporter;
}

interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  bcc?: string | string[];
}

export async function sendMail({ to, subject, text, html, bcc }: SendMailOptions) {
  const t = getTransporter();
  const recipients = Array.isArray(to) ? to.join(", ") : to;
  return trackIntegration(
    {
      service: "email",
      action: "SEND_EMAIL",
      // Omit html/text body from payload to keep logs concise
      payload: { to: recipients, subject },
    },
    () =>
      t.sendMail({
        from: env.SMTP_FROM(),
        to: recipients,
        subject,
        text,
        html,
        ...(bcc ? { bcc: Array.isArray(bcc) ? bcc.join(", ") : bcc } : {}),
      })
  );
}

/** Pause execution for `ms` milliseconds. */
export const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/**
 * Sends a single email with up to `maxRetries` attempts and exponential backoff.
 * Use this inside bulk-send loops to gracefully handle transient Gmail throttle errors.
 */
export async function sendMailWithRetry(
  options: SendMailOptions,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendMail(options);
      return;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      // Exponential backoff: 2 s, 4 s before the 2nd and 3rd attempts
      await delay(attempt * 2000);
    }
  }
}
