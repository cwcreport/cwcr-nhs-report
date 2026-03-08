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
      service: "gmail",
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
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
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
      })
  );
}
