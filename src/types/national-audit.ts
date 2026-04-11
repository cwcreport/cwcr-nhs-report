/* ──────────────────────────────────────────
   Type: INationalAuditReport
   Structured data for AI-generated national
   federal oversight audit reports.
   Shared between Gemini responseSchema,
   API responses, and frontend rendering.
   ────────────────────────────────────────── */

import type {
  IStateExecutiveBrief,
  ILeaderboardEntry,
  IBottomLeaderboardEntry,
} from "./zonal-audit";

/** Summary for one geopolitical zone within the national report */
export interface IZoneBrief {
  zoneName: string;
  zoneActiveFellows: number;
  zoneTotalLGAs: number;
  zoneTotalMentors: number;
  stateExecutiveBriefs: IStateExecutiveBrief[];
}

/** Top and bottom performing LGAs at national level */
export interface INationalLeadershipBoard {
  topLGAs: ILeaderboardEntry[];
  bottomLGAs: IBottomLeaderboardEntry[];
}

/** National-level operational insights */
export interface INationalOperationalInsights {
  overallProgress: string;
  challengesIdentified: string[];
  solutionsProffered: string;
}

/** Strategic recommendations from the team lead */
export interface INationalStrategicRecommendations {
  strategicDirective: string;
  commendation: string;
}

/** Root type for the entire National Federal Oversight Report */
export interface INationalAuditReport {
  reportingPeriod: string;
  totalStates: number;
  totalLGAs: number;
  totalActiveFellows: number;
  totalMentors: number;

  geopoliticalZoneBriefs: IZoneBrief[];

  nationalLeadershipBoard: INationalLeadershipBoard;

  nationalOperationalInsights: INationalOperationalInsights;

  strategicRecommendations: INationalStrategicRecommendations;
}
