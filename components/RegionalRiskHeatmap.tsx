"use client";

import DashboardCard from "./DashboardCard";
import { RegionalRisk } from "@/lib/types";

interface RegionalRiskHeatmapProps {
  regions: RegionalRisk[];
  status: "loading" | "success" | "error";
}

export default function RegionalRiskHeatmap({
  regions,
  status,
}: RegionalRiskHeatmapProps) {
  const totalEvents = regions.reduce((sum, r) => sum + r.eventCount, 0);
  const topRegions = [...regions]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);
  const highestSeverity =
    topRegions.length > 0 ? topRegions[0].highestSeverity : "neutral";

  const dominantType =
    regions.length > 0
      ? [...regions].sort((a, b) => b.eventCount - a.eventCount)[0]
          ?.dominantDisasterType || "--"
      : "--";

  return (
    <DashboardCard
      title="Regional Risk Heatmap"
      summary={
        topRegions.length > 0
          ? `Highest risk regions: ${topRegions.map((r) => r.region).join(", ")}. Active monitoring across ${regions.length} regions with ${totalEvents} total events tracked.`
          : "No regional data available. Upload a CSV file to begin analysis."
      }
      severityLevel={highestSeverity}
      metrics={[
        {
          label: "Top Region",
          value: topRegions[0]?.region || "--",
        },
        { label: "Active Events", value: String(totalEvents) },
        { label: "Dominant Type", value: dominantType },
      ]}
      lastUpdated={new Date().toISOString().split("T")[0]}
      href="/regional-analysis"
      status={status}
    />
  );
}
