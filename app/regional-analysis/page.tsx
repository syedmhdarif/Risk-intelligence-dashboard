"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Globe, TrendingUp, Loader2 } from "lucide-react";
import { RegionalRisk, AnalysisSummary, SeverityLevel } from "@/lib/types";
import { withBasePath } from "@/lib/config";

const severityColors: Record<SeverityLevel, string> = {
  red: "bg-severity-red",
  orange: "bg-severity-orange",
  green: "bg-severity-green",
  neutral: "bg-severity-neutral",
};

const severityTextColors: Record<SeverityLevel, string> = {
  red: "text-severity-red",
  orange: "text-severity-orange",
  green: "text-severity-green",
  neutral: "text-severity-neutral",
};

export default function RegionalAnalysisPage() {
  const [regions, setRegions] = useState<RegionalRisk[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataset = localStorage.getItem("activeDataset");
    if (!dataset) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(withBasePath(`/data/${encodeURIComponent(dataset)}/regionalRiskHeatmap.json`)).then((r) => r.ok ? r.json() : []),
      fetch(withBasePath(`/data/${encodeURIComponent(dataset)}/analysisSummary.json`)).then((r) => r.ok ? r.json() : null),
    ])
      .then(([regionsData, summaryData]) => {
        setRegions(regionsData || []);
        setSummary(summaryData || null);
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

  const sorted = [...regions].sort((a, b) => b.riskScore - a.riskScore);
  const totalEvents = sorted.reduce((sum, r) => sum + r.eventCount, 0);

  // Compute clustering stats from real data
  const highRiskRegions = sorted.filter((r) => r.riskScore >= 60);
  const multiHazardRegions = sorted.filter((r) => {
    // Regions with both high event count and severity
    return r.eventCount >= 3 && r.highestSeverity !== "green";
  });
  const escalatingRegions = sorted.filter(
    (r) => r.highestSeverity === "red" || r.highestSeverity === "orange"
  );

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
            <Globe className="h-7 w-7 text-accent" />
            Regional Risk Analysis
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">
            MONITORING {sorted.length} REGIONS — {totalEvents} ACTIVE EVENTS
          </p>
        </motion.div>

        {/* AI Insight */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 rounded-xl border border-card-border bg-card-bg p-6"
          >
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              AI-Generated Regional Insight
            </h2>
            <p className="leading-relaxed text-muted">{summary.summary}</p>
            {summary.keyInsights && summary.keyInsights.length > 0 && (
              <ul className="mt-3 space-y-1">
                {summary.keyInsights.map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {insight}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {/* Severity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-xl border border-card-border bg-card-bg p-6"
        >
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
            Severity Distribution
          </h2>
          <div className="space-y-3">
            {sorted.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="rounded-lg border border-card-border bg-surface p-4 transition-all duration-200 hover:border-accent/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.05)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-muted/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {region.region}
                      </h3>
                      <p className="font-mono text-[10px] text-muted">
                        {region.eventCount} EVENTS —{" "}
                        {region.dominantDisasterType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--severity-${region.highestSeverity}) 15%, transparent)`,
                      }}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${severityColors[region.highestSeverity]}`}
                      />
                      <span
                        className={severityTextColors[region.highestSeverity]}
                      >
                        {region.highestSeverity.toUpperCase()}
                      </span>
                    </span>
                    <span className="font-mono text-lg font-bold text-foreground">
                      {region.riskScore}
                    </span>
                  </div>
                </div>
                {/* Risk bar */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-card-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${region.riskScore}%` }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: `var(--severity-${region.highestSeverity})`,
                      boxShadow: `0 0 10px color-mix(in srgb, var(--severity-${region.highestSeverity}) 40%, transparent)`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Event Clustering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-card-border bg-card-bg p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
            <TrendingUp className="h-4 w-4 text-accent" />
            Event Clustering Summary
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-card-border bg-surface p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                High-Risk Regions
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-accent">
                {highRiskRegions.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                {highRiskRegions
                  .slice(0, 3)
                  .map((r) => r.region)
                  .join(", ") || "None"}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-surface p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Elevated Alert Zones
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-accent">
                {escalatingRegions.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                {escalatingRegions
                  .slice(0, 3)
                  .map((r) => r.region)
                  .join(", ") || "None"}
              </p>
            </div>
            <div className="rounded-lg border border-card-border bg-surface p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Multi-Hazard Zones
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-accent">
                {multiHazardRegions.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                {multiHazardRegions
                  .slice(0, 3)
                  .map((r) => r.region)
                  .join(", ") || "None"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
