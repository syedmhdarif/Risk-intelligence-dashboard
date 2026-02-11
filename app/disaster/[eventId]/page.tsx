"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import { DisasterEvent, SeverityLevel } from "@/lib/types";

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

export default function DisasterDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [event, setEvent] = useState<DisasterEvent | null>(null);
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
        const events: DisasterEvent[] = data.disasterSeverity || [];
        const found = events.find((e) => e.id === eventId);
        setEvent(found || null);
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground">
            Event Not Found
          </h1>
          <p className="mt-2 text-muted">
            The requested disaster event could not be found.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {event.eventName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  {event.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  {event.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  {event.populationExposed} exposed
                </span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${
                event.alertLevel === "red" ? "critical-pulse" : ""
              }`}
              style={{
                backgroundColor: `color-mix(in srgb, var(--severity-${event.alertLevel}) 15%, transparent)`,
              }}
            >
              <span
                className={`h-2 w-2 rounded-full ${severityColors[event.alertLevel]}`}
              />
              <span className={severityTextColors[event.alertLevel]}>
                {event.alertLevel.toUpperCase()} ALERT
              </span>
            </span>
          </div>
        </motion.div>

        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-xl border border-card-border bg-card-bg p-6"
        >
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
            <AlertTriangle className="h-4 w-4 text-accent" />
            AI-Generated Analysis
          </h2>
          <p className="leading-relaxed text-muted">
            {event.detailedAnalysis || event.aiSummary}
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Timeline */}
          {event.timeline && event.timeline.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-card-border bg-card-bg p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                <Clock className="h-4 w-4 text-accent" />
                Timeline
              </h2>
              <div className="space-y-4">
                {event.timeline.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(0,229,255,0.4)]" />
                      {index < event.timeline!.length - 1 && (
                        <div className="mt-1 h-full w-px bg-card-border" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-mono text-[11px] font-medium text-accent">
                        {entry.date}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {entry.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Impact Breakdown */}
          {event.impactBreakdown && event.impactBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-card-border bg-card-bg p-6"
            >
              <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
                Impact Breakdown
              </h2>
              <div className="space-y-3">
                {event.impactBreakdown.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between rounded-lg border border-card-border bg-surface px-4 py-3"
                  >
                    <span className="text-sm text-muted">{item.category}</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Coordinates */}
        {event.coordinates && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 rounded-xl border border-card-border bg-card-bg p-6"
          >
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">
              Geographic Coordinates
            </h2>
            <div className="flex gap-8 font-mono text-sm">
              <div>
                <span className="text-muted">LAT </span>
                <span className="font-bold text-accent">
                  {event.coordinates.lat}
                </span>
              </div>
              <div>
                <span className="text-muted">LNG </span>
                <span className="font-bold text-accent">
                  {event.coordinates.lng}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 rounded-xl border border-card-border bg-card-bg p-6"
        >
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
            Event Metadata
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Event ID", value: event.id },
              { label: "Event Type", value: event.eventType },
              { label: "Country", value: event.country },
              { label: "Alert Level", value: event.alertLevel.toUpperCase() },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {item.label}
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
