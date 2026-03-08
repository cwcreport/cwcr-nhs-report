/* ──────────────────────────────────────────
   Activity logging helper
   ────────────────────────────────────────── */
import { connectDB } from "@/lib/db";
import { ActivityLog } from "@/models";
import type { Session } from "next-auth";

export interface LogActivityOptions {
  session: Session | null | undefined;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

/**
 * Fire-and-forget activity logger. Never throws — logging failures must
 * never break the primary request flow.
 */
export async function logActivity(opts: LogActivityOptions): Promise<void> {
  try {
    await connectDB();
    await ActivityLog.create({
      actorId:    opts.session?.user?.id,
      actorName:  opts.session?.user?.name ?? "System",
      actorRole:  opts.session?.user?.role ?? "system",
      action:     opts.action,
      targetType: opts.targetType,
      targetId:   opts.targetId,
      targetName: opts.targetName,
      meta:       opts.meta,
      ip:         opts.ip,
    });
  } catch (err) {
    // Logging must never crash the app
    console.error("[logActivity] Failed to write activity log:", err);
  }
}
