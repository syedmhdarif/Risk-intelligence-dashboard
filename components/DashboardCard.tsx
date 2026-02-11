"use client";

import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { DashboardCardProps, SeverityLevel } from "@/lib/types";

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

const severityLabels: Record<SeverityLevel, string> = {
  red: "CRITICAL",
  orange: "WARNING",
  green: "WATCH",
  neutral: "NORMAL",
};

function SeverityBadge({ level }: { level: SeverityLevel }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
      style={{ backgroundColor: `color-mix(in srgb, var(--severity-${level}) 15%, transparent)` }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${severityColors[level]}`} />
      <span className={severityTextColors[level]}>{severityLabels[level]}</span>
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex h-64 flex-col gap-4 py-2">
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-4/5" />
      <div className="skeleton h-4 w-3/5" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="skeleton h-16" />
        <div className="skeleton h-16" />
        <div className="skeleton h-16" />
      </div>
      <div className="skeleton mt-auto h-10 w-full" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-severity-red/20 bg-severity-red/5">
      <AlertTriangle className="h-8 w-8 text-severity-red" />
      <p className="text-sm text-severity-red">
        {message || "Analysis failed. Please retry."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Analysis
        </button>
      )}
    </div>
  );
}

export default function DashboardCard({
  title,
  summary,
  severityLevel,
  metrics,
  lastUpdated,
  href,
  status,
  errorMessage,
}: DashboardCardProps) {
  const isCritical = severityLevel === "red";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`group flex flex-col rounded-xl border border-card-border bg-card-bg p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] hover:border-accent/20 ${
        isCritical && status === "success" ? "critical-pulse" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {title}
        </h3>
        <SeverityBadge level={severityLevel} />
      </div>

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState message={errorMessage} />}

      {status === "success" && (
        <>
          <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted">
            {summary}
          </p>

          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-card-border bg-surface px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {metric.label}
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-foreground">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-card-border pt-4">
            <p className="font-mono text-[10px] text-muted">
              UPDATED {lastUpdated}
            </p>
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent transition-colors hover:text-accent/80"
            >
              View Details
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </>
      )}
    </motion.div>
  );
}
