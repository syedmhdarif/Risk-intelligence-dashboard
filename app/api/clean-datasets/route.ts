import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CLEAN_DATASET_DIR = path.join(process.cwd(), "documents", "cleanDataset");

export async function GET() {
  try {
    if (!fs.existsSync(CLEAN_DATASET_DIR)) {
      return NextResponse.json({ datasets: [] });
    }

    const entries = fs.readdirSync(CLEAN_DATASET_DIR, { withFileTypes: true });
    const datasets = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const dirPath = path.join(CLEAN_DATASET_DIR, entry.name);
        const hasAnalysis = fs.existsSync(
          path.join(dirPath, "analysisSummary.json")
        );
        return {
          name: entry.name,
          ready: hasAnalysis,
        };
      })
      .filter((d) => d.ready);

    return NextResponse.json({ datasets });
  } catch {
    return NextResponse.json({ datasets: [] });
  }
}
