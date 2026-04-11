/* ──────────────────────────────────────────
   NationalAuditPreview — renders INationalAuditReport
   as a styled preview with all template sections.
   ────────────────────────────────────────── */
"use client";

import type { INationalAuditReport } from "@/types/national-audit";

interface NationalAuditPreviewProps {
  data: INationalAuditReport;
}

export default function NationalAuditPreview({ data }: NationalAuditPreviewProps) {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────── */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <h2 className="text-lg font-bold text-blue-800">
          National Health Fellows Mentorship Program — Federal Oversight Report
        </h2>
        <p className="mt-1 text-sm text-blue-700">
          Reporting Period: <span className="font-medium">{data.reportingPeriod}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-6 text-sm text-gray-700">
          <span>
            Total States: <strong>{data.totalStates}</strong>
          </span>
          <span>
            Total LGAs: <strong>{data.totalLGAs}</strong>
          </span>
          <span>
            Active Fellows: <strong>{data.totalActiveFellows}</strong>
          </span>
          <span>
            Total Mentors: <strong>{data.totalMentors}</strong>
          </span>
        </div>
      </div>

      {/* ── Section 1: Geopolitical Zone Briefs ── */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          1. Geopolitical Zone Briefs
        </h3>
        <div className="space-y-5">
          {data.geopoliticalZoneBriefs.map((zone, zi) => (
            <div key={zi} className="rounded-md border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-blue-700">{zone.zoneName}</h4>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Fellows: <strong>{zone.zoneActiveFellows}</strong></span>
                  <span>LGAs: <strong>{zone.zoneTotalLGAs}</strong></span>
                  <span>Mentors: <strong>{zone.zoneTotalMentors}</strong></span>
                </div>
              </div>
              <div className="space-y-2">
                {zone.stateExecutiveBriefs.map((brief, si) => (
                  <div key={si} className="rounded border-l-4 border-blue-200 bg-gray-50 p-3">
                    <h5 className="text-sm font-semibold text-gray-700">{brief.stateName}</h5>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{brief.brief}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: National Leadership Board ── */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          2. National Leadership Board
        </h3>

        {/* Top LGAs */}
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">Top Performing LGAs</h4>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Rank</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">LGA</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">State</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">KPI</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.nationalLeadershipBoard.topLGAs.map((entry, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2 font-semibold text-blue-700">{entry.rank}</td>
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
                {data.nationalLeadershipBoard.bottomLGAs.map((entry, i) => (
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

      {/* ── Section 3: National Operational Insights ── */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          3. National Operational Insights
        </h3>
        <div className="space-y-3 rounded-md border bg-white p-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Overall Progress</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.nationalOperationalInsights.overallProgress}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Challenges Identified</h4>
            <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
              {data.nationalOperationalInsights.challengesIdentified.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Solutions Proffered</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.nationalOperationalInsights.solutionsProffered}
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
            <h4 className="text-sm font-medium text-gray-700">Strategic Directive</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.strategicRecommendations.strategicDirective}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Commendation</h4>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
              {data.strategicRecommendations.commendation}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
