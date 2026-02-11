import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCUMENTS_DIR = path.join(process.cwd(), "documents");

export async function GET() {
  try {
    const files = fs.readdirSync(DOCUMENTS_DIR).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".csv", ".json", ".xlsx", ".tsv"].includes(ext);
    });

    const datasets = files.map((file) => ({
      name: file,
      extension: path.extname(file).toLowerCase(),
      size: fs.statSync(path.join(DOCUMENTS_DIR, file)).size,
    }));

    return NextResponse.json({ datasets });
  } catch {
    return NextResponse.json({ datasets: [] });
  }
}
