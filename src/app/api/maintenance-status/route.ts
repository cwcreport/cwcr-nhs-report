import { NextResponse } from "next/server";
import { getMaintenanceConfig } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getMaintenanceConfig();

  return NextResponse.json(
    {
      maintenance: config.enabled,
      message: config.message,
      estimatedUntil: config.estimatedUntil,
      contactEmail: config.contactEmail,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
