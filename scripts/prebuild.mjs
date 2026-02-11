import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CLEAN_DATASET_DIR = path.join(ROOT, "documents", "cleanDataset");
const PUBLIC_DATA_DIR = path.join(ROOT, "public", "data");

const EXPECTED_FILES = [
  "analysisSummary.json",
  "disasterSeverity.json",
  "regionalRiskHeatmap.json",
  "disasterTrendAnalyzer.json",
  "recentEvents.json",
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean previous output
if (fs.existsSync(PUBLIC_DATA_DIR)) {
  fs.rmSync(PUBLIC_DATA_DIR, { recursive: true });
}
fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

// Copy each clean dataset directory
const datasets = [];

if (fs.existsSync(CLEAN_DATASET_DIR)) {
  for (const entry of fs.readdirSync(CLEAN_DATASET_DIR, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;

    const srcDir = path.join(CLEAN_DATASET_DIR, entry.name);
    const hasAnalysis = fs.existsSync(
      path.join(srcDir, "analysisSummary.json")
    );

    if (!hasAnalysis) continue;

    const destDir = path.join(PUBLIC_DATA_DIR, entry.name);
    copyDir(srcDir, destDir);
    datasets.push({ name: entry.name, ready: true });

    console.log(`  Copied: ${entry.name}`);
  }
}

// Write datasets manifest
fs.writeFileSync(
  path.join(PUBLIC_DATA_DIR, "datasets.json"),
  JSON.stringify({ datasets }, null, 2)
);

console.log(
  `Prebuild complete: ${datasets.length} dataset(s) copied to public/data/`
);
