/* ──────────────────────────────────────────
   API: /api/admin/integration-logs
   ────────────────────────────────────────── */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { IntegrationLog } from "@/models";
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

  const service = url.searchParams.get("service");
  if (service) filter.service = service;

  const action = url.searchParams.get("action");
  if (action) filter.action = { $regex: action, $options: "i" };

  const status = url.searchParams.get("status");
  if (status) filter.status = status;

  const actorName = url.searchParams.get("actorName");
  if (actorName) filter.actorName = { $regex: actorName, $options: "i" };

  const from = url.searchParams.get("from");
  const to   = url.searchParams.get("to");
  if (from || to) {
    filter.createdAt = {} as Record<string, Date>;
    if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from);
    if (to)   (filter.createdAt as Record<string, Date>).$lte = new Date(to + "T23:59:59Z");
  }

  const [logs, total] = await Promise.all([
    IntegrationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    IntegrationLog.countDocuments(filter),
  ]);

  return jsonOk({
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const url = new URL(request.url);
  if (url.searchParams.get("confirm") !== "yes") {
    return jsonError("Pass ?confirm=yes to clear all integration logs", 400);
  }

  await connectDB();
  const result = await IntegrationLog.deleteMany({});
  return jsonOk({ message: `Cleared ${result.deletedCount} integration log entries` });
}
