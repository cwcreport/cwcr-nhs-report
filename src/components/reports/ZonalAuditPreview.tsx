/* ──────────────────────────────────────────
   ZonalAuditPreview — renders IZonalAuditReport
   as a styled preview with all 4 template sections.
   ────────────────────────────────────────── */
"use client";

import type { IZonalAuditReport } from "@/types/zonal-audit";

interface ZonalAuditPreviewProps {
  data: IZonalAuditReport;
  readOnly?: boolean;
}

export default function ZonalAuditPreview({ data }: ZonalAuditPreviewProps) {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────── */}
      <div className="rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 p-5">
        <h2 className="text-lg font-bold text-green-800">
          {data.zoneName} — Zonal Monthly Performance Audit
        </h2>
        <p className="mt-1 text-sm text-green-700">
          Reporting Period: <span className="font-medium">{data.reportingPeriod}</span>
        </p>
        <div className="mt-3 flex gap-6 text-sm text-gray-700">
          <span>
            Total LGAs: <strong>{data.totalLGAs}</strong>
          </span>
          <span>
            Active Fellows: <strong>{data.activeFellows}</strong>
          </span>
        </div>
      </div>

      {/* ── Section 1: State Executive Briefs ── */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          1. State Executive Briefs
        </h3>
        <div className="space-y-3">
          {data.stateExecutiveBriefs.map((brief, i) => (
            <div key={i} className="rounded-md border bg-white p-4">
              <h4 className="text-sm font-semibold text-green-700">{brief.stateName}</h4>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{brief.brief}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Zonal Leadership Board ── */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          2. Zonal Leadership Board
        </h3>

        {/* Top LGAs */}
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">Top Performing LGAs</h4>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Rank</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">LGA</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">State</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">KPI</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.zonalLeadershipBoard.topLGAs.map((entry, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2 font-semibold text-green-700">{entry.rank}</td>
                    <td className="px-3 py-2">{entry.lgaName}</td>
                    <td className="px-3 py-2">{entry.state}</td>
                    <td className="px-3 py-2">{entry.kpi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom LGAs */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-700">LGAs Needing Improvement</h4>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Rank</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">LGA</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">State</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Area for Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.zonalLeadershipBoard.bottomLGAs.map((entry, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2 font-semibold text-red-600">{entry.rank}</td>
                    <td className="px-3 py-2">{entry.lgaName}</td>
                    <td className="px-3 py-2">{entry.state}</td>
                    <td className="px-3 py-2">{entry.areaForImprovement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 3: Operational Insights ── */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          3. Operational Insights
        </h3>
        <div className="space-y-3 rounded-md border bg-white p-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Progress of Zone</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.operationalInsights.progressOfZone}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Challenges Identified</h4>
            <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
              {data.operationalInsights.challengesIdentified.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Solutions Proffered</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.operationalInsights.solutionsProffered}
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: Strategic Recommendations ── */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          4. Strategic Recommendations
        </h3>
        <div className="space-y-3 rounded-md border bg-white p-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Coordinator Directive</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.strategicRecommendations.coordinatorDirective}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Team Lead Commendation</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.strategicRecommendations.teamLeadCommendation}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
