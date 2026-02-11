"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { TrendDataPoint, AnalysisSummary } from "@/lib/types";

export default function TrendAnalysisPage() {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataset = localStorage.getItem("activeDataset");
    if (!dataset) {
      setLoading(false);
      return;
    }

    fetch(`/api/clean-datasets/${encodeURIComponent(dataset)}`)
      .then((res) => res.json())
      .then((data) => {
        setTrendData(data.disasterTrendAnalyzer || []);
        setSummary(data.analysisSummary || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const maxEvents = Math.max(...trendData.map((d) => d.eventCount), 1);

  const totalRed = trendData.reduce(
    (sum, d) => sum + d.severityBreakdown.red,
    0
  );
  const totalOrange = trendData.reduce(
    (sum, d) => sum + d.severityBreakdown.orange,
    0
  );
  const totalGreen = trendData.reduce(
    (sum, d) => sum + d.severityBreakdown.green,
    0
  );

  const typeCounts: Record<string, number> = {};
  trendData.forEach((d) => {
    typeCounts[d.dominantType] = (typeCounts[d.dominantType] || 0) + 1;
  });
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  const first = trendData[0]?.eventCount ?? 0;
  const last = trendData[trendData.length - 1]?.eventCount ?? 0;
  const escalating = last > first;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground">
            <BarChart3 className="h-7 w-7 text-accent" />
            Disaster Trend Analysis
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">
            {trendData.length}-DAY MONITORING WINDOW — SEVERITY BREAKDOWN &
            TYPE FREQUENCY
          </p>
        </motion.div>

        {/* Time Series Chart */}
        {trendData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 rounded-xl border border-card-border bg-card-bg p-6"
          >
            <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-foreground">
              Event Timeline
            </h2>
            <div className="flex items-end gap-2" style={{ height: 200 }}>
              {trendData.map((point, index) => {
                const height = (point.eventCount / maxEvents) * 100;
                const totalForDay =
                  point.severityBreakdown.red +
                  point.severityBreakdown.orange +
                  point.severityBreakdown.green;
                const redPct =
                  totalForDay > 0
                    ? (point.severityBreakdown.red / totalForDay) * 100
                    : 0;
                const orangePct =
                  totalForDay > 0
                    ? (point.severityBreakdown.orange / totalForDay) * 100
                    : 0;

                return (
                  <div
                    key={point.date}
                    className="group relative flex flex-1 flex-col items-center"
                  >
                    <div
                      className="relative w-full max-w-[48px] overflow-hidden rounded-t-md"
                      style={{ height: `${height}%` }}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{
                          delay: 0.3 + index * 0.05,
                          duration: 0.5,
                        }}
                        className="absolute bottom-0 w-full"
                      >
                        <div
                          className="w-full bg-severity-red"
                          style={{ height: `${redPct}%` }}
                        />
                        <div
                          className="w-full bg-severity-orange"
                          style={{ height: `${orangePct}%` }}
                        />
                        <div
                          className="w-full bg-severity-green"
                          style={{
                            height: `${100 - redPct - orangePct}%`,
                          }}
                        />
                      </motion.div>
                    </div>
                    <p className="mt-2 font-mono text-[10px] text-muted">
                      {point.date.slice(5)}
                    </p>

                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg border border-card-border bg-card-bg px-3 py-1.5 shadow-lg group-hover:block">
                      <p className="font-mono text-xs font-bold text-accent">
                        {point.eventCount} events
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-severity-red" />
                Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-severity-orange" />
                Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-severity-green" />
                Watch
              </span>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Event Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-card-border bg-card-bg p-6"
          >
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
              Event Breakdown by Type
            </h2>
            <div className="space-y-3">
              {typeEntries.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{type}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-card-border">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(count / trendData.length) * 100}%`,
                        }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="h-full rounded-full bg-accent"
                        style={{
                          boxShadow: "0 0 8px rgba(0, 229, 255, 0.3)",
                        }}
                      />
                    </div>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {count}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Escalation Detection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-card-border bg-card-bg p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Escalation Detection
            </h2>
            <div
              className={`mb-4 rounded-lg border p-4 ${
                escalating
                  ? "border-severity-red/20 bg-severity-red/5"
                  : "border-severity-green/20 bg-severity-green/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={`h-5 w-5 ${
                    escalating ? "text-severity-red" : "text-severity-green"
                  }`}
                />
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    escalating ? "text-severity-red" : "text-severity-green"
                  }`}
                >
                  {escalating ? "Escalation Detected" : "Trend Stable"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {escalating
                  ? `Event count increased from ${first} to ${last} over the monitoring period. Critical events showing upward trajectory.`
                  : "No significant escalation patterns detected in the monitoring period."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-card-border bg-surface p-3 text-center">
                <p className="font-mono text-2xl font-bold text-severity-red">
                  {totalRed}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Critical
                </p>
              </div>
              <div className="rounded-lg border border-card-border bg-surface p-3 text-center">
                <p className="font-mono text-2xl font-bold text-severity-orange">
                  {totalOrange}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Warning
                </p>
              </div>
              <div className="rounded-lg border border-card-border bg-surface p-3 text-center">
                <p className="font-mono text-2xl font-bold text-severity-green">
                  {totalGreen}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Watch
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Trend Analysis */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 rounded-xl border border-card-border bg-card-bg p-6"
          >
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              AI-Generated Trend Analysis
            </h2>
            <p className="leading-relaxed text-muted">{summary.summary}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
