import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ReportHistory } from "@/models/ReportHistory";
import { ReportHistoryReportType } from "@/lib/constants";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        const history = await ReportHistory.find({
            reportId: id,
            reportType: ReportHistoryReportType.MENTOR_MONTHLY_REPORT,
        })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(history);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
