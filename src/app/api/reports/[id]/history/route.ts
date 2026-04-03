import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { ReportHistory } from "@/models";
import { ReportHistoryReportType } from "@/lib/constants";
import { requireAuth } from "@/lib/auth-guard";
import { jsonOk, jsonError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const history = await ReportHistory.find({
    reportId: id,
    reportType: ReportHistoryReportType.WEEKLY_REPORT,
  })
    .sort({ createdAt: -1 })
    .lean();

  return jsonOk(history);
}
