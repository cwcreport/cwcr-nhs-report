/* ──────────────────────────────────────────
   Type: IZonalAuditReport
   Structured data for AI-generated zonal
   monthly performance audit reports.
   Shared between Gemini responseSchema,
   API responses, and frontend rendering.
   ────────────────────────────────────────── */

export interface IStateExecutiveBrief {
  stateName: string;
  brief: string;
}

export interface ILeaderboardEntry {
  rank: number;
  lgaName: string;
  state: string;
  kpi: string;
}

export interface IBottomLeaderboardEntry {
  rank: number;
  lgaName: string;
  state: string;
  areaForImprovement: string;
}

export interface IZonalLeadershipBoard {
  topLGAs: ILeaderboardEntry[];
  bottomLGAs: IBottomLeaderboardEntry[];
}

export interface IOperationalInsights {
  progressOfZone: string;
  challengesIdentified: string[];
  solutionsProffered: string;
}

export interface IStrategicRecommendations {
  coordinatorDirective: string;
  teamLeadCommendation: string;
}

export interface IZonalAuditReport {
  zoneName: string;
  reportingPeriod: string;
  totalLGAs: number;
  activeFellows: number;

  stateExecutiveBriefs: IStateExecutiveBrief[];

  zonalLeadershipBoard: IZonalLeadershipBoard;

  operationalInsights: IOperationalInsights;

  strategicRecommendations: IStrategicRecommendations;
}
