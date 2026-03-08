/* ──────────────────────────────────────────
   Integration logging helper
   ────────────────────────────────────────── */
import { connectDB } from "@/lib/db";
import { IntegrationLog } from "@/models";
import type { Session } from "next-auth";

export interface LogIntegrationOptions {
  service: string;            // e.g. "email", "cloudinary"
  action: string;             // e.g. "SEND_EMAIL", "UPLOAD_IMAGE"
  payload?: unknown;          // what was sent
  session?: Session | null;
  meta?: Record<string, unknown>;
}

export interface IntegrationResult {
  status: "success" | "failure";
  response?: unknown;
  error?: string;
  durationMs?: number;
}

/**
 * Fire-and-forget integration logger.
 * Call after an external call completes (success or failure).
 */
export async function logIntegration(
  opts: LogIntegrationOptions,
  result: IntegrationResult
): Promise<void> {
  try {
    await connectDB();
    await IntegrationLog.create({
      service:    opts.service,
      action:     opts.action,
      status:     result.status,
      durationMs: result.durationMs,
      payload:    opts.payload,
      response:   result.response,
      error:      result.error,
      actorId:    opts.session?.user?.id,
      actorName:  opts.session?.user?.name ?? undefined,
      actorRole:  opts.session?.user?.role ?? undefined,
      meta:       opts.meta,
    });
  } catch (inner) {
    console.error("[logIntegration] Failed to write integration log:", inner);
  }
}

/**
 * Convenience: wrap an async external call, measure its duration,
 * log the outcome, and return its value (re-throwing on error).
 *
 * @example
 * const info = await trackIntegration(
 *   { service: "email", action: "SEND_EMAIL", payload: { to, subject }, session },
 *   () => sendMail({ to, subject, html })
 * );
 */
export async function trackIntegration<T>(
  opts: LogIntegrationOptions,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const response = await fn();
    void logIntegration(opts, {
      status: "success",
      response: response as unknown,
      durationMs: Date.now() - start,
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    void logIntegration(opts, {
      status: "failure",
      error: message,
      durationMs: Date.now() - start,
    });
    throw err;
  }
}
