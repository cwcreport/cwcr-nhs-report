/* ──────────────────────────────────────────
   Model: IntegrationLog
   ────────────────────────────────────────── */
import mongoose, { Schema, Document, Model, Types, models } from "mongoose";

export interface IIntegrationLog extends Document {
  service: string;       // e.g. "email", "cloudinary", "cron"
  action: string;        // e.g. "SEND_EMAIL", "UPLOAD_IMAGE"
  status: "success" | "failure";
  durationMs?: number;
  payload?: unknown;     // what was sent (sanitised — no passwords)
  response?: unknown;    // what came back
  error?: string;        // error message if status = "failure"
  actorId?: Types.ObjectId;
  actorName?: string;
  actorRole?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const IntegrationLogSchema = new Schema<IIntegrationLog>(
  {
    service:    { type: String, required: true, index: true },
    action:     { type: String, required: true, index: true },
    status:     { type: String, enum: ["success", "failure"], required: true, index: true },
    durationMs: { type: Number },
    payload:    { type: Schema.Types.Mixed },
    response:   { type: Schema.Types.Mixed },
    error:      { type: String },
    actorId:    { type: Schema.Types.ObjectId, ref: "User" },
    actorName:  { type: String },
    actorRole:  { type: String },
    meta:       { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL: auto-expire after 9 days
IntegrationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 9 });

export const IntegrationLog: Model<IIntegrationLog> =
  models.IntegrationLog || mongoose.model<IIntegrationLog>("IntegrationLog", IntegrationLogSchema);
