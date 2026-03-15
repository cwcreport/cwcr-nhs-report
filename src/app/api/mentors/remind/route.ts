/* ──────────────────────────────────────────
   POST /api/mentors/remind
   Coordinators / Admins can manually send
   report-reminder emails to mentors who
   haven't submitted for the current week.
   ────────────────────────────────────────── */
import { connectDB } from "@/lib/db";
import { User, WeeklyReport, Mentor, Coordinator } from "@/models";
import { UserRole } from "@/lib/constants";
import { requireRole } from "@/lib/auth-guard";
import { jsonOk, jsonError } from "@/lib/api-helpers";
import { sendMailWithRetry, delay } from "@/lib/mailer";
import { reminderEmailTemplate } from "@/lib/email-templates";
import { currentWeekKey } from "@/lib/date-helpers";
import { env } from "@/lib/env";

export async function POST() {
  const { session, error } = await requireRole(UserRole.ADMIN, UserRole.COORDINATOR);
  if (error) return error;

  await connectDB();

  const weekKey = currentWeekKey();

  // Mentors who already submitted this week
  const submittedMentorDocIds = await WeeklyReport.find({ weekKey }).distinct("mentor");

  const mentorDocFilter: Record<string, unknown> = {
    _id: { $nin: submittedMentorDocIds },
  };

  if (session!.user.role === UserRole.COORDINATOR) {
    const coordinator = await Coordinator.findOne({ authId: session!.user.id }).lean();
    if (!coordinator) return jsonError("Coordinator record not found", 404);

    mentorDocFilter.coordinator = coordinator._id;

    const allowedStates = (coordinator.states || []).map((s) => s.toUpperCase().trim()).filter(Boolean);
    if (allowedStates.length) mentorDocFilter.states = { $in: allowedStates };
  }

  const mentorDocsToRemind = await Mentor.find(mentorDocFilter).select("authId").lean();
  const mentorAuthIds = mentorDocsToRemind.map((m) => m.authId);

  const mentorsToRemind = await User.find({
    _id: { $in: mentorAuthIds },
    role: UserRole.MENTOR,
    active: true,
  }).lean();

  if (mentorsToRemind.length === 0) {
    return jsonOk({
      weekKey,
      totalMentors: 0,
      remindersSent: 0,
      message: "All mentors have already submitted their reports for this week.",
      errors: [],
    });
  }

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
    message: `Reminder sent to ${sent} mentor(s).`,
    errors,
  });
}
