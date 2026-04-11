/* ──────────────────────────────────────────
   GET    /api/reports/national-audit/:id
   DELETE /api/reports/national-audit/:id
   ────────────────────────────────────────── */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SavedNationalAudit } from "@/models/SavedNationalAudit";
import { UserRole } from "@/lib/constants";
import { logActivity } from "@/lib/activity-logger";

const ALLOWED_READ_ROLES = [UserRole.ADMIN, UserRole.TEAM_RESEARCH_LEAD, UserRole.ME_OFFICER];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ALLOWED_READ_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const audit = await SavedNationalAudit.findById(id)
      .populate("generatedBy", "name email")
      .lean();

    if (!audit) {
      return NextResponse.json({ error: "National audit not found." }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Only admins can delete national audit reports." }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const deleted = await SavedNationalAudit.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "National audit not found." }, { status: 404 });
    }

    void logActivity({
      session,
      action: "DELETE_NATIONAL_AUDIT",
      targetType: "SavedNationalAudit",
      targetId: id,
      targetName: `National Audit – ${deleted.month}`,
    });

    return NextResponse.json({ message: "Deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
