/* ──────────────────────────────────────────
   Cron: /api/cron/reminders — send reminder emails
   Protected by CRON_SECRET bearer token
   ────────────────────────────────────────── */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User, WeeklyReport, Mentor } from "@/models";
import { UserRole } from "@/lib/constants";
import { validateCronSecret } from "@/lib/auth-guard";
import { jsonOk, jsonError } from "@/lib/api-helpers";
import { sendMailWithRetry, delay } from "@/lib/mailer";
import { reminderEmailTemplate } from "@/lib/email-templates";
import { currentWeekKey } from "@/lib/date-helpers";
import { env } from "@/lib/env";

async function handle(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return jsonError("Unauthorized", 401);
  }

  await connectDB();

  const weekKey = currentWeekKey();

  // Find mentors who have NOT submitted for this week
  const submittedMentorDocIds = await WeeklyReport.find({ weekKey }).distinct("mentor");
  const mentorDocsToRemind = await Mentor.find({
    _id: { $nin: submittedMentorDocIds },
  }).select("authId").lean();

  const mentorAuthIds = mentorDocsToRemind.map((m) => m.authId);
  const mentorsToRemind = await User.find({
    _id: { $in: mentorAuthIds },
    role: UserRole.MENTOR,
    active: true,
  }).lean();

  const appUrl = env.NEXTAUTH_URL();
  let sent = 0;
  const errors: string[] = [];

  const BATCH_SIZE = 20;
  const INTER_EMAIL_DELAY_MS = 1000;  // 1 s between each send
  const INTER_BATCH_DELAY_MS = 5000; // 5 s between batches

  for (let i = 0; i < mentorsToRemind.length; i++) {
    const mentor = mentorsToRemind[i];
    try {
      const { subject, text, html } = reminderEmailTemplate(mentor.name, weekKey, appUrl);
      await sendMailWithRetry({ to: mentor.email, subject, text, html });
      sent++;
    } catch (err) {
      errors.push(`${mentor.email}: ${(err as Error).message}`);
    }

    const isLastInBatch = (i + 1) % BATCH_SIZE === 0;
    const isLast = i === mentorsToRemind.length - 1;
    if (!isLast) {
      await delay(isLastInBatch ? INTER_BATCH_DELAY_MS : INTER_EMAIL_DELAY_MS);
    }
  }

  return jsonOk({
    weekKey,
    totalMentors: mentorsToRemind.length,
    remindersSent: sent,
    errors,
  });
}

// Vercel Cron Jobs trigger via GET
export async function GET(request: NextRequest) {
  return handle(request);
}

// Keep POST for manual runs/tools
export async function POST(request: NextRequest) {
  return handle(request);
}
