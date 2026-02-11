"use client";

import DashboardCard from "./DashboardCard";
import { TrendDataPoint } from "@/lib/types";

interface DisasterTrendAnalyzerProps {
  trendData: TrendDataPoint[];
  status: "loading" | "success" | "error";
}

export default function DisasterTrendAnalyzer({
  trendData,
  status,
}: DisasterTrendAnalyzerProps) {
  const last7 = trendData.slice(-7);
  const recentTotal = last7.reduce((sum, d) => sum + d.eventCount, 0);
  const previousTotal = trendData
    .slice(-14, -7)
    .reduce((sum, d) => sum + d.eventCount, 0);

  const trendDirection =
    previousTotal === 0
      ? "Stable"
      : recentTotal > previousTotal
        ? `+${Math.round(((recentTotal - previousTotal) / previousTotal) * 100)}%`
        : `${Math.round(((recentTotal - previousTotal) / previousTotal) * 100)}%`;

  const typeCounts: Record<string, number> = {};
  last7.forEach((d) => {
    typeCounts[d.dominantType] = (typeCounts[d.dominantType] || 0) + 1;
  });
  const mostFrequent =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "--";

  const latestSeverity = last7.length > 0 ? last7[last7.length - 1] : null;
  const severityLevel = latestSeverity
    ? latestSeverity.severityBreakdown.red > 2
      ? ("red" as const)
      : latestSeverity.severityBreakdown.orange > 3
        ? ("orange" as const)
        : ("green" as const)
    : ("neutral" as const);

  return (
    <DashboardCard
      title="Disaster Trend Analyzer"
      summary={
        last7.length > 0
          ? `${recentTotal} events recorded in the past 7 days. ${mostFrequent} is the most frequent disaster type with a ${trendDirection} trend.`
          : "No trend data available. Upload a CSV file to begin analysis."
      }
      severityLevel={severityLevel}
      metrics={[
        { label: "7-Day Trend", value: trendDirection },
        { label: "Period Events", value: String(recentTotal) },
        { label: "Most Frequent", value: mostFrequent },
      ]}
      lastUpdated={last7[last7.length - 1]?.date || "--"}
      href="/trend-analysis"
      status={status}
    />
  );
}
