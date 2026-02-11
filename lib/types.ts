export type SeverityLevel = "red" | "orange" | "green" | "neutral";

export interface SkillOutput {
  headline: string;
  summary: string;
  severityLevel: SeverityLevel;
  keyInsights: string[];
  riskScore: string;
  generatedAt: string;
}

export interface DisasterEvent {
  id: string;
  eventName: string;
  country: string;
  alertLevel: SeverityLevel;
  populationExposed: string;
  eventType: string;
  aiSummary: string;
  date: string;
  coordinates?: { lat: number; lng: number };
  timeline?: { date: string; description: string }[];
  impactBreakdown?: { category: string; value: string }[];
  detailedAnalysis?: string;
}

export interface RegionalRisk {
  region: string;
  eventCount: number;
  highestSeverity: SeverityLevel;
  riskScore: number;
  dominantDisasterType: string;
}

export interface TrendDataPoint {
  date: string;
  eventCount: number;
  severityBreakdown: {
    red: number;
    orange: number;
    green: number;
  };
  dominantType: string;
}

export interface DashboardCardProps {
  title: string;
  summary: string;
  severityLevel: SeverityLevel;
  metrics: { label: string; value: string }[];
  lastUpdated: string;
  href: string;
  status: "loading" | "success" | "error";
  errorMessage?: string;
}

export interface AnalysisSummary {
  headline: string;
  summary: string;
  severityLevel: SeverityLevel;
  keyInsights: string[];
  riskScore: string;
  generatedAt: string;
  metadata: {
    totalEvents: number;
    dateRange: { from: string; to: string };
    eventTypes: Record<string, number>;
    severityDistribution: Record<string, number>;
  };
}

export interface CleanDataset {
  name: string;
  ready: boolean;
}

export interface DatasetPayload {
  dataset: string;
  analysisSummary: AnalysisSummary | null;
  disasterSeverity: DisasterEvent[] | null;
  regionalRiskHeatmap: RegionalRisk[] | null;
  disasterTrendAnalyzer: TrendDataPoint[] | null;
  recentEvents: DisasterEvent[] | null;
}
