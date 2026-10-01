/**
 * Maintenance Mode Configuration and Helpers
 *
 * Controls system-wide suspension of routes when MAINTENANCE_MODE is set.
 */

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  estimatedUntil?: string | null;
  bypassSecret?: string | null;
  contactEmail: string;
}

export function getMaintenanceConfig(): MaintenanceConfig {
  const envVal =
    process.env.MAINTENANCE_MODE ??
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE ??
    "";
  const normalized = envVal.trim().toLowerCase();
  const enabled =
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "on";

  const message =
    process.env.MAINTENANCE_MESSAGE ||
    "The CWC Research Mentorship Portal is currently undergoing scheduled maintenance and platform upgrades. All data, drafts, and records are completely safe. We will be back online shortly.";

  const estimatedUntil =
    process.env.MAINTENANCE_UNTIL ||
    process.env.NEXT_PUBLIC_MAINTENANCE_UNTIL ||
    null;

  const bypassSecret =
    process.env.MAINTENANCE_BYPASS_TOKEN ||
    process.env.MAINTENANCE_BYPASS_SECRET ||
    null;

  const contactEmail =
    process.env.MAINTENANCE_CONTACT_EMAIL ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    "support@cwcr.ng";

  return {
    enabled,
    message,
    estimatedUntil,
    bypassSecret,
    contactEmail,
  };
}

export function isMaintenanceMode(): boolean {
  return getMaintenanceConfig().enabled;
}
