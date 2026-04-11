/* ──────────────────────────────────────────
   GET  /api/reports/national-audit       (list)
   POST /api/reports/national-audit       (upsert)
   ────────────────────────────────────────── */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SavedNationalAudit } from "@/models/SavedNationalAudit";
import { UserRole } from "@/lib/constants";
import { logActivity } from "@/lib/activity-logger";

const ALLOWED_READ_ROLES = [UserRole.ADMIN, UserRole.TEAM_RESEARCH_LEAD, UserRole.ME_OFFICER];

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ALLOWED_READ_ROLES.includes(session.user.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      SavedNationalAudit.find({})
        .populate("generatedBy", "name email")
        .sort({ month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedNationalAudit.countDocuments({}),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Only admins can save national audit reports." }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { month, auditData } = body;

    if (!month || !auditData) {
      return NextResponse.json({ error: "month and auditData are required." }, { status: 400 });
    }

    // Upsert: update if already saved for this month, otherwise create
    const saved = await SavedNationalAudit.findOneAndUpdate(
      { month },
      { auditData, generatedBy: session.user.id },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    void logActivity({
      session,
      action: "SAVE_NATIONAL_AUDIT",
      targetType: "SavedNationalAudit",
      targetId: saved._id.toString(),
      targetName: `National Audit – ${month}`,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
