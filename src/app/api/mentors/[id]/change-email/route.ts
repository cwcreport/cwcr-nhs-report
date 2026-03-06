/* ──────────────────────────────────────────
   API: /api/mentors/[id]/change-email — Admin change mentor email
   - Resets password to a temporary one
   - Emails the temp password to the new email
   ────────────────────────────────────────── */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { UserRole } from "@/lib/constants";
import { requireRole } from "@/lib/auth-guard";
import { jsonOk, jsonError, parseBody } from "@/lib/api-helpers";
import { mentorEmailChangedTemplate } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { env } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("base64url").slice(0, 14);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const { id } = await params;
  const body = await parseBody<{ email?: string }>(request);

  const newEmail = String(body?.email ?? "")
    .trim()
    .toLowerCase();

  if (!newEmail) return jsonError("New email is required");
  if (!newEmail.includes("@")) return jsonError("Invalid email address");

  await connectDB();

  const user = await User.findById(id).select("name email role active").lean();
  if (!user) return jsonError("Mentor not found", 404);
  if (user.role !== UserRole.MENTOR) return jsonError("Mentor not found", 404);

  const emailInUse = await User.findOne({ email: newEmail, _id: { $ne: id } }).select("_id").lean();
  if (emailInUse) return jsonError("Email is already in use", 409);

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  await User.updateOne(
    { _id: id },
    {
      $set: {
        email: newEmail,
        password: hashedPassword,
      },
    },
  );

  const tpl = mentorEmailChangedTemplate(user.name, newEmail, tempPassword, env.NEXTAUTH_URL());
  await sendMail({ to: newEmail, subject: tpl.subject, text: tpl.text, html: tpl.html });

  return jsonOk({
    success: true,
    message: "Mentor email updated and temporary password sent",
  });
}
