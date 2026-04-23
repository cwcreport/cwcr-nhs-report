/* ──────────────────────────────────────────
   Model: AppSettings  (singleton)
   ────────────────────────────────────────── */
import mongoose, { Schema, Document, Model, models } from "mongoose";

export interface IEditLockConfig {
  mentor: boolean;
  coordinator: boolean;
}

export interface IAppSettings extends Document {
  blockWeeklyReportEdits: IEditLockConfig;
  blockMonthlyReportEdits: IEditLockConfig;
  updatedAt: Date;
  createdAt: Date;
}

const EditLockConfigSchema = new Schema<IEditLockConfig>(
  {
    mentor: { type: Boolean, default: false },
    coordinator: { type: Boolean, default: false },
  },
  { _id: false },
);

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    blockWeeklyReportEdits: { type: EditLockConfigSchema, default: () => ({ mentor: false, coordinator: false }) },
    blockMonthlyReportEdits: { type: EditLockConfigSchema, default: () => ({ mentor: false, coordinator: false }) },
  },
  { timestamps: true },
);

export const AppSettings: Model<IAppSettings> =
  (models.AppSettings as Model<IAppSettings>) ||
  mongoose.model<IAppSettings>("AppSettings", AppSettingsSchema);
