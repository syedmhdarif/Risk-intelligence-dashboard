import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DOCUMENTS_DIR = path.join(process.cwd(), "documents");

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^\uFEFF/, "").replace(/^"|"$/g, ""));

  // Skip comment rows (lines starting with #)
  return lines
    .slice(1)
    .filter((line) => !line.startsWith("#"))
    .map((line) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ""));

      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || "";
      });
      return row;
    });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = path.join(DOCUMENTS_DIR, filename);

    // Security: ensure the resolved path is within DOCUMENTS_DIR
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(DOCUMENTS_DIR))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filename).toLowerCase();

    if (ext === ".csv" || ext === ".tsv") {
      const data = parseCSV(content);
      return NextResponse.json({ data, filename, rowCount: data.length });
    }

    if (ext === ".json") {
      const data = JSON.parse(content);
      return NextResponse.json({
        data: Array.isArray(data) ? data : [data],
        filename,
        rowCount: Array.isArray(data) ? data.length : 1,
      });
    }

    return NextResponse.json(
      { error: "Unsupported file format" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to read dataset" },
      { status: 500 }
    );
  }
}
