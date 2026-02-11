"use client";

import DashboardCard from "./DashboardCard";
import { DisasterEvent } from "@/lib/types";

interface DisasterSeverityProps {
  event: DisasterEvent | null;
  status: "loading" | "success" | "error";
}

export default function DisasterSeverity({
  event,
  status,
}: DisasterSeverityProps) {
  if (!event) {
    return (
      <DashboardCard
        title="Disaster Severity"
        summary="No disaster event data available. Upload a CSV file to begin analysis."
        severityLevel="neutral"
        metrics={[]}
        lastUpdated="--"
        href="#"
        status="success"
      />
    );
  }

  return (
    <DashboardCard
      title="Disaster Severity"
      summary={event.aiSummary}
      severityLevel={event.alertLevel}
      metrics={[
        { label: "Alert Level", value: event.alertLevel.toUpperCase() },
        { label: "Population Exposed", value: event.populationExposed },
        { label: "Event Type", value: event.eventType },
      ]}
      lastUpdated={event.date}
      href={`/disaster?id=${event.id}`}
      status={status}
    />
  );
}
