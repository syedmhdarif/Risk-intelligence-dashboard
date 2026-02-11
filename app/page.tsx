"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import DisasterSeverity from "@/components/DisasterSeverity";
import RegionalRiskHeatmap from "@/components/RegionalRiskHeatmap";
import DisasterTrendAnalyzer from "@/components/DisasterTrendAnalyzer";
import { Activity } from "lucide-react";
import {
  DisasterEvent,
  RegionalRisk,
  TrendDataPoint,
  AnalysisSummary,
  DatasetPayload,
} from "@/lib/types";

export default function Dashboard() {
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [regions, setRegions] = useState<RegionalRisk[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [recentEvents, setRecentEvents] = useState<DisasterEvent[]>([]);

  const loadDataset = useCallback(async (datasetName: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/clean-datasets/${encodeURIComponent(datasetName)}`
      );
      const data: DatasetPayload = await res.json();

      setSummary(data.analysisSummary);
      setEvents(data.disasterSeverity || []);
      setRegions(data.regionalRiskHeatmap || []);
      setTrendData(data.disasterTrendAnalyzer || []);
      setRecentEvents(data.recentEvents || []);
      setActiveDataset(datasetName);

      // Persist selection for subpages
      localStorage.setItem("activeDataset", datasetName);
    } catch {
      // Keep current state on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load last selected dataset or first available
  useEffect(() => {
    const saved = localStorage.getItem("activeDataset");
    if (saved) {
      loadDataset(saved);
    } else {
      fetch("/api/clean-datasets")
        .then((res) => res.json())
        .then((data) => {
          const datasets = data.datasets || [];
          if (datasets.length > 0) {
            loadDataset(datasets[0].name);
          }
        })
        .catch(() => {});
    }
  }, [loadDataset]);

  const handleDatasetSelect = (datasetName: string) => {
    loadDataset(datasetName);
  };

  const criticalEvent =
    events.length > 0
      ? [...events].sort((a, b) => {
          const priority = { red: 0, orange: 1, green: 2, neutral: 3 };
          return (
            (priority[a.alertLevel] ?? 3) - (priority[b.alertLevel] ?? 3)
          );
        })[0]
      : null;

  const cardStatus = loading
    ? ("loading" as const)
    : ("success" as const);

  const lastUpdated = summary?.generatedAt
    ? new Date(summary.generatedAt)
        .toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
        .toUpperCase()
    : "--";

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onDatasetSelect={handleDatasetSelect}
        lastUpdated={lastUpdated}
        activeDataset={activeDataset}
        loading={loading}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
            <Activity className="h-3.5 w-3.5 text-accent" />
            <span>Live Intelligence Feed</span>
            <span className="relative ml-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-severity-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-severity-green" />
            </span>
          </div>
        </motion.div>

        {/* Analysis Summary Banner */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 rounded-lg border border-accent/20 bg-accent/5 p-4"
          >
            <p className="font-mono text-xs font-bold text-accent">
              {summary.headline}
            </p>
            <p className="mt-1 text-sm text-muted">{summary.summary}</p>
          </motion.div>
        )}

        {!activeDataset && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 rounded-lg border border-card-border bg-surface p-4 text-center"
          >
            <p className="font-mono text-xs text-muted">
              SELECT A DATASET FROM THE DROPDOWN TO LOAD INTELLIGENCE DATA
            </p>
          </motion.div>
        )}

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DisasterSeverity event={criticalEvent} status={cardStatus} />
          <RegionalRiskHeatmap regions={regions} status={cardStatus} />
          <DisasterTrendAnalyzer trendData={trendData} status={cardStatus} />
        </div>

        {/* Recent Events Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 rounded-xl border border-card-border bg-card-bg p-6"
        >
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
            Recent Events
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Country</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Alert</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {(recentEvents.length > 0
                  ? recentEvents
                  : events.slice(0, 10)
                ).map((event) => (
                  <tr
                    key={event.id}
                    className="transition-colors hover:bg-surface/50"
                  >
                    <td className="max-w-xs truncate py-3 pr-4 text-sm font-semibold text-foreground">
                      {event.eventName}
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted">
                      {event.country}
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted">
                      {event.eventType}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: `var(--severity-${event.alertLevel})`,
                          boxShadow: `0 0 8px color-mix(in srgb, var(--severity-${event.alertLevel}) 40%, transparent)`,
                        }}
                      />
                    </td>
                    <td className="py-3 font-mono text-xs text-muted">
                      {event.date}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center font-mono text-xs text-muted"
                    >
                      No event data loaded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
