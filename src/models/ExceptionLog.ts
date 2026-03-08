/* ──────────────────────────────────────────
   Model: ExceptionLog
   ────────────────────────────────────────── */
import mongoose, { Schema, Document, Model, Types, models } from "mongoose";

export interface IExceptionLog extends Document {
  message: string;
  stack?: string;
  context: string;       // e.g. "POST /api/reports", "sendMail"
  actorId?: Types.ObjectId;
  actorName?: string;
  actorRole?: string;
  request?: {
    method?: string;
    url?: string;
    body?: unknown;
  };
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const ExceptionLogSchema = new Schema<IExceptionLog>(
  {
    message:    { type: String, required: true },
    stack:      { type: String },
    context:    { type: String, required: true, index: true },
    actorId:    { type: Schema.Types.ObjectId, ref: "User" },
    actorName:  { type: String },
    actorRole:  { type: String },
    request: {
      method: { type: String },
      url:    { type: String },
      body:   { type: Schema.Types.Mixed },
    },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL: auto-expire after 9 days
ExceptionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 9 });

export const ExceptionLog: Model<IExceptionLog> =
  models.ExceptionLog || mongoose.model<IExceptionLog>("ExceptionLog", ExceptionLogSchema);
