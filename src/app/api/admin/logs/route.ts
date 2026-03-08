/* ──────────────────────────────────────────
   API: /api/admin/logs — Activity log viewer
   ────────────────────────────────────────── */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { ActivityLog } from "@/models";
import { UserRole } from "@/lib/constants";
import { requireRole } from "@/lib/auth-guard";
import { jsonOk, jsonError, parsePagination } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  await connectDB();

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url);

  const filter: Record<string, unknown> = {};

  const action = url.searchParams.get("action");
  if (action) filter.action = { $regex: action, $options: "i" };

  const actorRole = url.searchParams.get("actorRole");
  if (actorRole) filter.actorRole = actorRole;

  const actorName = url.searchParams.get("actorName");
  if (actorName) filter.actorName = { $regex: actorName, $options: "i" };

  const targetType = url.searchParams.get("targetType");
  if (targetType) filter.targetType = targetType;

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from || to) {
    filter.createdAt = {} as Record<string, Date>;
    if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from);
    if (to)   (filter.createdAt as Record<string, Date>).$lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return jsonOk({
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// DELETE /api/admin/logs — clear all logs (dangerous, admin only)
export async function DELETE(request: NextRequest) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const url = new URL(request.url);
  const confirm = url.searchParams.get("confirm");
  if (confirm !== "yes") {
    return jsonError("Pass ?confirm=yes to clear all logs", 400);
  }

  await connectDB();
  const result = await ActivityLog.deleteMany({});
  return jsonOk({ message: `Cleared ${result.deletedCount} log entries` });
}
