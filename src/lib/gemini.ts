/* ──────────────────────────────────────────
   Gemini AI client for audit report generation
   ────────────────────────────────────────── */
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { env } from "@/lib/env";
import { TEAM_LEAD_NAME } from "@/lib/constants";
import type { IZonalAuditReport } from "@/types/zonal-audit";
import type { INationalAuditReport } from "@/types/national-audit";

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const key = env.GEMINI_API_KEY();
    if (!key) throw new Error("GEMINI_API_KEY is not configured");
    _client = new GoogleGenerativeAI(key);
  }
  return _client;
}

/**
 * Gemini JSON‐mode response schema matching IZonalAuditReport.
 * This constrains the model to return the exact structure.
 */
const zonalAuditResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    zoneName:        { type: SchemaType.STRING, description: "Geopolitical zone name, e.g. 'South-South'" },
    reportingPeriod: { type: SchemaType.STRING, description: "Month and year, e.g. 'April, 2026'" },
    totalLGAs:       { type: SchemaType.INTEGER, description: "Total number of LGAs covered" },
    activeFellows:   { type: SchemaType.INTEGER, description: "Total number of active fellows" },

    stateExecutiveBriefs: {
      type: SchemaType.ARRAY,
      description: "One executive brief per state",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          stateName: { type: SchemaType.STRING },
          brief:     { type: SchemaType.STRING, description: "Narrative paragraph summarising the state's performance" },
        },
        required: ["stateName", "brief"],
      },
    },

    zonalLeadershipBoard: {
      type: SchemaType.OBJECT,
      description: "Top and bottom performing LGAs",
      properties: {
        topLGAs: {
          type: SchemaType.ARRAY,
          description: "Top 5 performing LGAs across all states",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              rank:    { type: SchemaType.INTEGER },
              lgaName: { type: SchemaType.STRING },
              state:   { type: SchemaType.STRING },
              kpi:     { type: SchemaType.STRING, description: "Key metric, e.g. '99% Attendance'" },
            },
            required: ["rank", "lgaName", "state", "kpi"],
          },
        },
        bottomLGAs: {
          type: SchemaType.ARRAY,
          description: "Bottom 5 LGAs needing improvement",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              rank:                { type: SchemaType.INTEGER },
              lgaName:             { type: SchemaType.STRING },
              state:               { type: SchemaType.STRING },
              areaForImprovement:  { type: SchemaType.STRING, description: "Specific area needing work" },
            },
            required: ["rank", "lgaName", "state", "areaForImprovement"],
          },
        },
      },
      required: ["topLGAs", "bottomLGAs"],
    },

    operationalInsights: {
      type: SchemaType.OBJECT,
      properties: {
        progressOfZone:       { type: SchemaType.STRING, description: "Overall progress narrative" },
        challengesIdentified: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of key challenges",
        },
        solutionsProffered:   { type: SchemaType.STRING, description: "Proposed solutions narrative" },
      },
      required: ["progressOfZone", "challengesIdentified", "solutionsProffered"],
    },

    strategicRecommendations: {
      type: SchemaType.OBJECT,
      properties: {
        coordinatorDirective:  { type: SchemaType.STRING, description: "Directive paragraph for the coordinator" },
        teamLeadCommendation:  { type: SchemaType.STRING, description: "Commendation paragraph from the team lead" },
      },
      required: ["coordinatorDirective", "teamLeadCommendation"],
    },
  },
  required: [
    "zoneName", "reportingPeriod", "totalLGAs", "activeFellows",
    "stateExecutiveBriefs", "zonalLeadershipBoard",
    "operationalInsights", "strategicRecommendations",
  ],
};

/**
 * Build the system prompt for the zonal audit generation.
 */
function buildSystemPrompt(zoneName: string, reportingPeriod: string, coordinatorName: string): string {
  return `You are an expert NHS (National Health Service) Zonal Performance Auditor for Nigeria's ${zoneName} zone.

Your task is to generate a comprehensive "Zonal Monthly Performance Audit" for ${reportingPeriod} using ONLY the data provided. Do NOT fabricate or infer data that is not present.

The report follows the "Zonal Master Template" with exactly 4 sections:

**Section 1 – State-by-State Executive Brief**
For each state, write a concise but informative narrative paragraph covering:
- Number of fellows and mentors active
- Attendance rates (sessions attended vs. held)
- Key achievements and impact highlights
- Notable challenges

**Section 2 – Zonal Leadership Board**
- Top 5 LGAs: Rank by overall performance (attendance, engagement, impact). Include a KPI summary.
- Bottom 5 LGAs: Rank by areas needing improvement. Be specific about what needs work.

**Section 3 – Operational Insights & Problem Solving**
- Progress of Zone: Overall narrative of how the zone is performing
- Challenges Identified: Aggregate the most common challenges across all reports
- Solutions Proffered: Practical, actionable solutions

**Section 4 – Strategic Recommendations**
- Coordinator Directive: Clear, actionable directives for the zonal coordinator
- Team Lead Commendation: A commendation paragraph from ${coordinatorName} (the Zonal Coordinator) acknowledging the zone's work

Use professional, formal language appropriate for an official NHS report. Be data-driven — reference specific numbers where available.`;
}

/**
 * Generate a structured zonal audit report using Gemini.
 *
 * @param reportData - Aggregated mentor monthly report data organised by state/LGA
 * @param zoneName   - Geopolitical zone name
 * @param period     - Reporting period string (e.g. "April, 2026")
 * @returns Structured IZonalAuditReport
 */
export async function generateZonalAudit(
  reportData: object,
  zoneName: string,
  period: string,
  coordinatorName: string,
): Promise<IZonalAuditReport> {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: zonalAuditResponseSchema,
    },
    systemInstruction: buildSystemPrompt(zoneName, period, coordinatorName),
  });

  const userPrompt = `Here is the aggregated data from all Mentor Monthly Reports for the ${zoneName} zone, ${period}:

${JSON.stringify(reportData, null, 2)}

Generate the complete Zonal Monthly Performance Audit report based on this data.`;

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  const parsed: IZonalAuditReport = JSON.parse(text);

  return parsed;
}

/* ──────────────────────────────────────────
   National Federal Oversight Audit
   ────────────────────────────────────────── */

/**
 * Gemini JSON-mode response schema matching INationalAuditReport.
 */
const nationalAuditResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    reportingPeriod: { type: SchemaType.STRING, description: "Month and year, e.g. 'April, 2026'" },
    totalStates:     { type: SchemaType.INTEGER, description: "Total states covered (max 37 incl. FCT)" },
    totalLGAs:       { type: SchemaType.INTEGER, description: "Total LGAs across all zones" },
    totalActiveFellows: { type: SchemaType.INTEGER, description: "Total active fellows nationally" },
    totalMentors:    { type: SchemaType.INTEGER, description: "Total mentors nationally" },

    geopoliticalZoneBriefs: {
      type: SchemaType.ARRAY,
      description: "One brief per geopolitical zone",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          zoneName:          { type: SchemaType.STRING, description: "Zone name, e.g. 'South-South'" },
          zoneActiveFellows: { type: SchemaType.INTEGER },
          zoneTotalLGAs:     { type: SchemaType.INTEGER },
          zoneTotalMentors:  { type: SchemaType.INTEGER },
          stateExecutiveBriefs: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                stateName: { type: SchemaType.STRING },
                brief:     { type: SchemaType.STRING },
              },
              required: ["stateName", "brief"],
            },
          },
        },
        required: ["zoneName", "zoneActiveFellows", "zoneTotalLGAs", "zoneTotalMentors", "stateExecutiveBriefs"],
      },
    },

    nationalLeadershipBoard: {
      type: SchemaType.OBJECT,
      description: "Top and bottom performing LGAs nationally",
      properties: {
        topLGAs: {
          type: SchemaType.ARRAY,
          description: "Top 10 performing LGAs across the nation",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              rank:    { type: SchemaType.INTEGER },
              lgaName: { type: SchemaType.STRING },
              state:   { type: SchemaType.STRING },
              kpi:     { type: SchemaType.STRING },
            },
            required: ["rank", "lgaName", "state", "kpi"],
          },
        },
        bottomLGAs: {
          type: SchemaType.ARRAY,
          description: "Bottom 10 LGAs needing improvement nationally",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              rank:               { type: SchemaType.INTEGER },
              lgaName:            { type: SchemaType.STRING },
              state:              { type: SchemaType.STRING },
              areaForImprovement: { type: SchemaType.STRING },
            },
            required: ["rank", "lgaName", "state", "areaForImprovement"],
          },
        },
      },
      required: ["topLGAs", "bottomLGAs"],
    },

    nationalOperationalInsights: {
      type: SchemaType.OBJECT,
      properties: {
        overallProgress:      { type: SchemaType.STRING, description: "Overall national progress narrative" },
        challengesIdentified: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Common challenges across all zones",
        },
        solutionsProffered:   { type: SchemaType.STRING, description: "National-level proposed solutions" },
      },
      required: ["overallProgress", "challengesIdentified", "solutionsProffered"],
    },

    strategicRecommendations: {
      type: SchemaType.OBJECT,
      properties: {
        strategicDirective: { type: SchemaType.STRING, description: "National strategic directive" },
        commendation:       { type: SchemaType.STRING, description: "Commendation from the Team Lead" },
      },
      required: ["strategicDirective", "commendation"],
    },
  },
  required: [
    "reportingPeriod", "totalStates", "totalLGAs", "totalActiveFellows", "totalMentors",
    "geopoliticalZoneBriefs", "nationalLeadershipBoard",
    "nationalOperationalInsights", "strategicRecommendations",
  ],
};

/**
 * Build the system prompt for the national federal oversight audit.
 */
function buildNationalSystemPrompt(reportingPeriod: string): string {
  return `You are an expert NHS (National Health Service) National Performance Auditor for Nigeria's Federal Oversight Programme.

Your task is to generate a comprehensive "National Federal Oversight Report" for ${reportingPeriod} using ONLY the data provided. Do NOT fabricate or infer data that is not present.

The report follows the "National Master Template" with exactly 6 sections covering all 6 geopolitical zones (North-Central including FCT, North-East, North-West, South-East, South-South, South-West):

**Section 1 – Geopolitical Zone Briefs**
For each of the 6 zones, provide:
- Zone-level summary stats (active fellows, LGAs covered, mentors)
- State-by-state executive briefs: a concise but informative narrative paragraph per state covering fellows, mentors, attendance, achievements, and challenges

**Section 2 – National Leadership Board**
- Top 10 LGAs nationally: Rank by overall performance (attendance, engagement, impact). Include a KPI summary for each.
- Bottom 10 LGAs nationally: Rank by areas needing improvement. Be specific about what needs work.

**Section 3 – National Operational Insights & Problem Solving**
- Overall Progress: National-level narrative of how the programme is performing
- Challenges Identified: Aggregate the most common challenges across all zones
- Solutions Proffered: Practical, actionable national-level solutions

**Section 4 – Strategic Recommendations**
- Strategic Directive: Clear, actionable national directives for programme leadership
- Commendation: A commendation paragraph from ${TEAM_LEAD_NAME} (the Team Research Lead) acknowledging the overall programme's achievements

Use professional, formal language appropriate for an official NHS national report. Be data-driven — reference specific numbers where available. Provide balanced coverage across all zones.`;
}

/**
 * Generate a structured national federal oversight audit report using Gemini.
 *
 * @param reportData - Aggregated mentor monthly report data organised by zone/state/LGA
 * @param period     - Reporting period string (e.g. "April, 2026")
 * @returns Structured INationalAuditReport
 */
export async function generateNationalAudit(
  reportData: object,
  period: string,
): Promise<INationalAuditReport> {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: nationalAuditResponseSchema,
    },
    systemInstruction: buildNationalSystemPrompt(period),
  });

  const userPrompt = `Here is the aggregated data from all Mentor Monthly Reports across all 6 geopolitical zones for ${period}:

${JSON.stringify(reportData, null, 2)}

Generate the complete National Federal Oversight Report based on this data.`;

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  const parsed: INationalAuditReport = JSON.parse(text);

  return parsed;
}
