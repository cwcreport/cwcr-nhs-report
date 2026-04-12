/* ──────────────────────────────────────────
   ZonalAuditPreview — renders IZonalAuditReport
   as a styled preview with all 4 template sections.
   When readOnly is false, fields become editable.
   ────────────────────────────────────────── */
"use client";

import type { IZonalAuditReport } from "@/types/zonal-audit";

interface ZonalAuditPreviewProps {
  data: IZonalAuditReport;
  readOnly?: boolean;
  onChange?: (data: IZonalAuditReport) => void;
}

export default function ZonalAuditPreview({
  data,
  readOnly = true,
  onChange,
}: ZonalAuditPreviewProps) {
  const editable = !readOnly && !!onChange;

  /* ── helpers ── */
  const update = (patch: Partial<IZonalAuditReport>) => {
    if (!editable) return;
    onChange({ ...data, ...patch });
  };

  const textareaClass =
    "w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-green-500 focus:outline-none";
  const inputClass =
    "w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-green-500 focus:outline-none";

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
          1. State-by-State Executive Brief
        </h3>
        <div className="space-y-3">
          {data.stateExecutiveBriefs.map((brief, i) => (
            <div key={i} className="rounded-md border bg-white p-4">
              <h4 className="text-sm font-semibold text-green-700">{brief.stateName}</h4>
              {editable ? (
                <textarea
                  className={`${textareaClass} mt-1`}
                  rows={4}
                  value={brief.brief}
                  onChange={(e) => {
                    const updated = [...data.stateExecutiveBriefs];
                    updated[i] = { ...brief, brief: e.target.value };
                    update({ stateExecutiveBriefs: updated });
                  }}
                />
              ) : (
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{brief.brief}</p>
              )}
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
                    <td className="px-3 py-2 font-semibold text-green-700">
                      {editable ? (
                        <input
                          className={inputClass}
                          type="number"
                          value={entry.rank}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.topLGAs];
                            updated[i] = { ...entry, rank: Number(e.target.value) };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, topLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editable ? (
                        <input
                          className={inputClass}
                          value={entry.lgaName}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.topLGAs];
                            updated[i] = { ...entry, lgaName: e.target.value };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, topLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.lgaName
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editable ? (
                        <input
                          className={inputClass}
                          value={entry.state}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.topLGAs];
                            updated[i] = { ...entry, state: e.target.value };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, topLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.state
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editable ? (
                        <input
                          className={inputClass}
                          value={entry.kpi}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.topLGAs];
                            updated[i] = { ...entry, kpi: e.target.value };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, topLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.kpi
                      )}
                    </td>
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
                    <td className="px-3 py-2 font-semibold text-red-600">
                      {editable ? (
                        <input
                          className={inputClass}
                          type="number"
                          value={entry.rank}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.bottomLGAs];
                            updated[i] = { ...entry, rank: Number(e.target.value) };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, bottomLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editable ? (
                        <input
                          className={inputClass}
                          value={entry.lgaName}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.bottomLGAs];
                            updated[i] = { ...entry, lgaName: e.target.value };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, bottomLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.lgaName
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editable ? (
                        <input
                          className={inputClass}
                          value={entry.state}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.bottomLGAs];
                            updated[i] = { ...entry, state: e.target.value };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, bottomLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.state
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editable ? (
                        <input
                          className={inputClass}
                          value={entry.areaForImprovement}
                          onChange={(e) => {
                            const updated = [...data.zonalLeadershipBoard.bottomLGAs];
                            updated[i] = { ...entry, areaForImprovement: e.target.value };
                            update({
                              zonalLeadershipBoard: { ...data.zonalLeadershipBoard, bottomLGAs: updated },
                            });
                          }}
                        />
                      ) : (
                        entry.areaForImprovement
                      )}
                    </td>
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
          3. Operational Insights &amp; Problem Solving
        </h3>
        <div className="space-y-3 rounded-md border bg-white p-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Progress of Zone</h4>
            {editable ? (
              <textarea
                className={`${textareaClass} mt-1`}
                rows={4}
                value={data.operationalInsights.progressOfZone}
                onChange={(e) =>
                  update({
                    operationalInsights: {
                      ...data.operationalInsights,
                      progressOfZone: e.target.value,
                    },
                  })
                }
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                {data.operationalInsights.progressOfZone}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Challenges Identified</h4>
            {editable ? (
              <div className="mt-1 space-y-2">
                {data.operationalInsights.challengesIdentified.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className={`${inputClass} flex-1`}
                      value={c}
                      onChange={(e) => {
                        const updated = [...data.operationalInsights.challengesIdentified];
                        updated[i] = e.target.value;
                        update({
                          operationalInsights: {
                            ...data.operationalInsights,
                            challengesIdentified: updated,
                          },
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const updated = data.operationalInsights.challengesIdentified.filter(
                          (_, idx) => idx !== i
                        );
                        update({
                          operationalInsights: {
                            ...data.operationalInsights,
                            challengesIdentified: updated,
                          },
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
                  onClick={() =>
                    update({
                      operationalInsights: {
                        ...data.operationalInsights,
                        challengesIdentified: [
                          ...data.operationalInsights.challengesIdentified,
                          "",
                        ],
                      },
                    })
                  }
                >
                  + Add Challenge
                </button>
              </div>
            ) : (
              <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                {data.operationalInsights.challengesIdentified.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Solutions Proffered</h4>
            {editable ? (
              <textarea
                className={`${textareaClass} mt-1`}
                rows={4}
                value={data.operationalInsights.solutionsProffered}
                onChange={(e) =>
                  update({
                    operationalInsights: {
                      ...data.operationalInsights,
                      solutionsProffered: e.target.value,
                    },
                  })
                }
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                {data.operationalInsights.solutionsProffered}
              </p>
            )}
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
            <h4 className="text-sm font-medium text-gray-700">Zonal Coordinator&apos;s Recommendation</h4>
            {editable ? (
              <textarea
                className={`${textareaClass} mt-1`}
                rows={4}
                value={data.strategicRecommendations.coordinatorDirective}
                onChange={(e) =>
                  update({
                    strategicRecommendations: {
                      ...data.strategicRecommendations,
                      coordinatorDirective: e.target.value,
                    },
                  })
                }
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                {data.strategicRecommendations.coordinatorDirective}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Zonal Coordinator&apos;s Commendation</h4>
            {editable ? (
              <textarea
                className={`${textareaClass} mt-1`}
                rows={4}
                value={data.strategicRecommendations.teamLeadCommendation}
                onChange={(e) =>
                  update({
                    strategicRecommendations: {
                      ...data.strategicRecommendations,
                      teamLeadCommendation: e.target.value,
                    },
                  })
                }
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                {data.strategicRecommendations.teamLeadCommendation}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
