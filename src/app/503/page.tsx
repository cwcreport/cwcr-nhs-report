"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wrench,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  HardDrive,
  FileText,
  KeyRound,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { APP_NAME, APP_PUBLIC_NAME } from "@/lib/constants";

export default function MaintenancePage() {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [bypassKey, setBypassKey] = useState("");
  const [bypassError, setBypassError] = useState("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check portal status via API
  const checkStatus = useCallback(async (manual = false) => {
    if (manual) setChecking(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/maintenance-status", {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setLastChecked(new Date());

        if (!data.maintenance) {
          setIsOnline(true);
          setStatusMessage("Portal is back online! Redirecting you now...");
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
          return;
        } else {
          setIsOnline(false);
          if (manual) {
            setStatusMessage("Maintenance is still ongoing. Please check back shortly.");
          }
        }
      } else {
        if (manual) {
          setStatusMessage("System is currently unreachable. Maintenance is in progress.");
        }
      }
    } catch {
      if (manual) {
        setStatusMessage("Unable to reach the server. Updates are actively being deployed.");
      }
    } finally {
      if (manual) setChecking(false);
    }
  }, []);

  // Set initial check and recurring auto-check
  useEffect(() => {
    checkStatus(false);
    if (!autoCheck) return;

    const interval = setInterval(() => {
      checkStatus(false);
    }, 25000); // Check every 25 seconds

    return () => clearInterval(interval);
  }, [autoCheck, checkStatus]);

  // Handle Admin Bypass submission
  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bypassKey.trim()) {
      setBypassError("Please enter your bypass token");
      return;
    }
    // Set bypass cookie and redirect with query parameter
    document.cookie = `maintenance_bypass=${encodeURIComponent(bypassKey.trim())}; path=/; max-age=86400; SameSite=Lax`;
    window.location.href = `/?bypass=${encodeURIComponent(bypassKey.trim())}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-gray-50 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-gray-100/80 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-orange-50 border border-orange-200/60 p-1 flex items-center justify-center shadow-xs overflow-hidden">
              <Image
                src="/logo.png"
                alt="CWCR-NHF Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-gray-900 block leading-tight">
                {APP_PUBLIC_NAME}
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">
                National Health Fellows Mentorship Programme
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Maintenance Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-3xl w-full mx-auto space-y-8">
          
          {/* Hero Card */}
          <div className="relative bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-orange-900/5 border border-gray-100 overflow-hidden text-center">
            {/* Subtle background ambient accents */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Icon Graphic */}
            <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-3xl rotate-6 opacity-20 animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-tr from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-white transform -rotate-12" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-gray-100">
                <Clock className="w-4 h-4 text-orange-600 animate-spin" style={{ animationDuration: "8s" }} />
              </div>
            </div>

            {/* Error Code & Title */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 text-orange-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              HTTP 503 • Scheduled Maintenance
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              We&apos;re Upgrading the Portal
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
              The {APP_NAME} is temporarily paused for essential system enhancements and database maintenance.
              We are working to restore normal operations as quickly as possible.
            </p>

            {/* Real-time Status / Actions */}
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 mb-8 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left w-full sm:w-auto">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    System State
                  </div>
                  <div className="text-sm font-medium text-gray-800 flex items-center gap-2 mt-0.5">
                    {isOnline ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                        <span className="text-green-700 font-semibold">Ready to reconnect</span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                        </span>
                        <span>Service temporarily suspended</span>
                      </>
                    )}
                  </div>
                  {lastChecked && (
                    <div className="text-[11px] text-gray-400 mt-1">
                      Last checked: {lastChecked.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => checkStatus(true)}
                  disabled={checking || isOnline}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-orange-700 hover:bg-orange-800 transition-all shadow-md shadow-orange-700/20 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                  {checking ? "Checking Status..." : isOnline ? "Connected" : "Check Portal Status"}
                </button>
              </div>

              {/* Status feedback banner */}
              {statusMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isOnline
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {statusMessage}
                </div>
              )}
            </div>

            {/* Auto-check toggle */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCheck}
                  onChange={(e) => setAutoCheck(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 h-3.5 w-3.5 border-gray-300"
                />
                <span>Auto-refresh when system comes back online (every 25s)</span>
              </label>
            </div>
          </div>

          {/* 3 Value & Reassurance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Your Data Is 100% Safe
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                All submitted mentor reports, draft entries, and mentee records remain securely backed up.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Platform Improvements
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                We are applying database optimizations and performance patches for faster load times.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Reporting Deadlines
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Submission windows are automatically accommodated for periods during scheduled downtime.
              </p>
            </div>
          </div>

          {/* System Services Status Grid */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
              Service Status Snapshot
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-700 font-medium">Core Web Application</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Suspended
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-700 font-medium">Reporting & Analytics API</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Under Maintenance
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-700 font-medium">Database & Storage Engine</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Upgrading & Syncing
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-700 font-medium">Authentication & Sessions</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Standby
                </span>
              </div>
            </div>
          </div>

          {/* Urgent Support / Need Help Card */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50/50 to-white rounded-2xl p-6 border border-orange-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white text-orange-600 shadow-xs border border-orange-100 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Need Urgent Technical Assistance?
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Reach out to the technical support team or the National Programme coordinator.
                </p>
              </div>
            </div>

            <a
              href="mailto:support@cwcr.ng"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-orange-800 bg-white hover:bg-orange-50 border border-orange-200 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              Contact Support
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Admin Bypass Section */}
          <div className="text-center pt-2">
            {!showAdminBypass ? (
              <button
                type="button"
                onClick={() => setShowAdminBypass(true)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Authorized Administrator Access</span>
              </button>
            ) : (
              <div className="max-w-md mx-auto bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                    Enter Bypass Passkey
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminBypass(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleBypassSubmit} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter MAINTENANCE_BYPASS_TOKEN..."
                    value={bypassKey}
                    onChange={(e) => {
                      setBypassKey(e.target.value);
                      setBypassError("");
                    }}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                  />
                  {bypassError && (
                    <div className="text-left text-[11px] text-red-600 font-medium">
                      {bypassError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Authenticate & Bypass Maintenance
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="space-x-3 text-[11px]">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:text-gray-600 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
