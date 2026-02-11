"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Clock,
  Database,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { CleanDataset } from "@/lib/types";

interface NavbarProps {
  onDatasetSelect: (datasetName: string) => void;
  lastUpdated: string;
  activeDataset: string | null;
  loading?: boolean;
}

export default function Navbar({
  onDatasetSelect,
  lastUpdated,
  activeDataset,
  loading,
}: NavbarProps) {
  const [datasets, setDatasets] = useState<CleanDataset[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/clean-datasets")
      .then((res) => res.json())
      .then((data) => setDatasets(data.datasets || []))
      .catch(() => setDatasets([]));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDatasetSelect = (name: string) => {
    setDropdownOpen(false);
    onDatasetSelect(name);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Shield className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Global Disaster Intelligence
            </h1>
            <p className="hidden font-mono text-[10px] tracking-wider text-muted sm:block">
              NEO COMMAND CENTER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 font-mono text-[11px] text-muted sm:flex">
            <Clock className="h-3.5 w-3.5" />
            <span>{lastUpdated}</span>
          </div>

          {/* Datasets Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-card-border bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground transition-all duration-200 hover:border-accent/30 hover:bg-accent/5 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)]"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              ) : (
                <Database className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {activeDataset || "Datasets"}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-2xl shadow-black/40"
                >
                  <div className="border-b border-card-border px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Processed Datasets
                    </p>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-1.5">
                    {datasets.length === 0 ? (
                      <div className="px-3 py-4 text-center font-mono text-[11px] text-muted">
                        No processed datasets found
                      </div>
                    ) : (
                      datasets.map((dataset) => {
                        const isActive = activeDataset === dataset.name;

                        return (
                          <button
                            key={dataset.name}
                            onClick={() => handleDatasetSelect(dataset.name)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${
                              isActive
                                ? "bg-accent/10 border border-accent/20"
                                : "hover:bg-surface border border-transparent"
                            }`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                                isActive
                                  ? "bg-accent/20 text-accent"
                                  : "bg-surface text-muted"
                              }`}
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`truncate text-xs font-semibold ${
                                  isActive ? "text-accent" : "text-foreground"
                                }`}
                              >
                                {dataset.name}
                              </p>
                              <p className="font-mono text-[10px] text-muted">
                                PROCESSED DATASET
                              </p>
                            </div>
                            {isActive && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
