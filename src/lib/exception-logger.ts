/* ──────────────────────────────────────────
   Exception logging helper
   ────────────────────────────────────────── */
import { connectDB } from "@/lib/db";
import { ExceptionLog } from "@/models";
import type { Session } from "next-auth";

export interface LogExceptionOptions {
  error: unknown;
  context: string;                        // e.g. "POST /api/reports"
  session?: Session | null;
  request?: { method?: string; url?: string; body?: unknown };
  meta?: Record<string, unknown>;
}

/**
 * Fire-and-forget exception logger.
 * Call this inside a catch block — it will never itself throw.
 */
export async function logException(opts: LogExceptionOptions): Promise<void> {
  try {
    const err = opts.error instanceof Error ? opts.error : new Error(String(opts.error));
    await connectDB();
    await ExceptionLog.create({
      message:   err.message,
      stack:     err.stack,
      context:   opts.context,
      actorId:   opts.session?.user?.id,
      actorName: opts.session?.user?.name ?? undefined,
      actorRole: opts.session?.user?.role ?? undefined,
      request:   opts.request,
      meta:      opts.meta,
    });
  } catch (inner) {
    console.error("[logException] Failed to write exception log:", inner);
  }
}
