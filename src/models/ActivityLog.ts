/* ──────────────────────────────────────────
   Model: ActivityLog
   ────────────────────────────────────────── */
import mongoose, { Schema, Document, Model, Types, models } from "mongoose";

export interface IActivityLog extends Document {
  actorId: Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string;         // e.g. "CREATE_MENTOR", "DELETE_COORDINATOR"
  targetType?: string;    // e.g. "Mentor", "Coordinator", "Report"
  targetId?: string;      // ID of the affected document
  targetName?: string;    // human-readable label of the target
  meta?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actorId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorName:  { type: String, required: true },
    actorRole:  { type: String, required: true },
    action:     { type: String, required: true, index: true },
    targetType: { type: String },
    targetId:   { type: String, index: true },
    targetName: { type: String },
    meta:       { type: Schema.Types.Mixed },
    ip:         { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL: auto-expire logs after 7 days (optional, remove if you want permanent logs)
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const ActivityLog: Model<IActivityLog> =
  models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
