import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CLEAN_DATASET_DIR = path.join(process.cwd(), "documents", "cleanDataset");

const EXPECTED_FILES = [
  "analysisSummary.json",
  "disasterSeverity.json",
  "regionalRiskHeatmap.json",
  "disasterTrendAnalyzer.json",
  "recentEvents.json",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> }
) {
  try {
    const { dataset } = await params;
    const datasetDir = path.join(CLEAN_DATASET_DIR, dataset);

    // Security: ensure path is within CLEAN_DATASET_DIR
    const resolved = path.resolve(datasetDir);
    if (!resolved.startsWith(path.resolve(CLEAN_DATASET_DIR))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (!fs.existsSync(datasetDir)) {
      return NextResponse.json(
        { error: "Dataset not found" },
        { status: 404 }
      );
    }

    const result: Record<string, unknown> = { dataset };

    for (const file of EXPECTED_FILES) {
      const filePath = path.join(datasetDir, file);
      const key = file.replace(".json", "");

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        result[key] = JSON.parse(content);
      } else {
        result[key] = null;
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to load dataset" },
      { status: 500 }
    );
  }
}
