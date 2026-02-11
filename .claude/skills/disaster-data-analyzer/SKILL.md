---
name: disaster-data-analyzer
description: >
  Analyze disaster CSV data (GDACS or similar) and produce structured JSON files for the
  Risk Intelligence Dashboard. Use this skill whenever the user wants to process, analyze,
  or convert disaster/risk CSV data into dashboard-ready JSON. Also use it when the user
  mentions uploading new data, refreshing the dashboard data, generating clean datasets,
  or anything related to turning raw disaster information into structured analysis output.
  The output goes into documents/cleanDataset/ and powers all dashboard segments.
---

# Disaster Data Analyzer

Converts raw disaster CSV data (primarily GDACS format) into structured JSON files that
power every section of the Risk Intelligence Dashboard.

## When to Use

- User uploads or points to a CSV file with disaster data
- User asks to "analyze the data", "process the CSV", "generate dashboard data"
- User wants to refresh or update the clean dataset
- User mentions cleanDataset, dashboard JSON, or data processing

## Input

A CSV file (typically from `documents/rawData/`) with disaster event rows. The primary
format is GDACS RSS, but the skill handles any CSV with columns that map to disaster
events (id, country, event type, severity, dates, coordinates, summary).

### Expected CSV Columns (GDACS format)

| Column | Description |
|--------|-------------|
| id | Unique event identifier (e.g. EQ1523937) |
| iso3 | ISO 3166-1 alpha-3 country code |
| country | Country name(s) |
| title | Short event title with severity color |
| summary | Detailed event description |
| event_type | Earthquake, Flood, Wildfire, Tropical Cyclone, Drought |
| severity_unit | Unit of measurement (M, km/h, ha, km2) |
| severity_value | Numeric severity value |
| source | Data source |
| from_date | Event start date |
| to_date | Event end date |
| link | GDACS report URL |
| geo_lat | Latitude |
| geo_long | Longitude |
| gdacs_bbox | Bounding box coordinates |

## Output

Each CSV gets its own subfolder inside `documents/cleanDataset/`, named after the CSV file
(without extension). This way multiple datasets coexist and the dashboard can let users
switch between them.

```
documents/cleanDataset/
├── GDACS-RSS-Information/        ← from GDACS-RSS-Information.csv
│   ├── analysisSummary.json
│   ├── disasterSeverity.json
│   ├── regionalRiskHeatmap.json
│   ├── disasterTrendAnalyzer.json
│   └── recentEvents.json
├── Another-Dataset/              ← from Another-Dataset.csv
│   └── ...
```

Five JSON files per dataset:

| File | Dashboard Segment | Description |
|------|-------------------|-------------|
| `analysisSummary.json` | Top-level overview | AI-generated headline, summary, key insights |
| `disasterSeverity.json` | Disaster Severity card | All events as `DisasterEvent[]`, sorted by severity |
| `regionalRiskHeatmap.json` | Regional Risk Heatmap card | Aggregated `RegionalRisk[]` by country/region |
| `disasterTrendAnalyzer.json` | Disaster Trend Analyzer card | Daily `TrendDataPoint[]` time series |
| `recentEvents.json` | Recent Events table | Latest events as `DisasterEvent[]`, sorted by date |

See `references/output-schemas.md` for the exact JSON structure of each file. The schemas
match the TypeScript interfaces in `lib/types.ts` so the dashboard can consume them directly.

## Workflow

### Step 1: Locate the CSV

Find the input file. Default location is `documents/rawData/`. If the user specifies a
different file, use that. Confirm the file exists and has data.

### Step 2: Run the parsing script

```bash
python3 .claude/skills/disaster-data-analyzer/scripts/parse_csv.py <csv-path> [output-base-dir]
```

Arguments:
- `<csv-path>`: Path to the input CSV file
- `[output-base-dir]`: Base output directory (default: `documents/cleanDataset`)

The script automatically creates a subfolder named after the CSV file. For example,
running on `GDACS-RSS-Information.csv` creates `documents/cleanDataset/GDACS-RSS-Information/`.

The script produces these intermediate files in the dataset subfolder:
- `_parsed_events.json` — All events structured as DisasterEvent objects
- `_regional_aggregation.json` — Events aggregated by country/region
- `_daily_trends.json` — Events grouped by date for trend analysis

These intermediate files contain the factual data extracted from the CSV. They give you
the structured foundation to build the final output files.

### Step 3: Generate AI-enhanced analysis

Read the intermediate files produced by the script. Then create the five final JSON files
by enriching the parsed data with intelligent analysis:

#### analysisSummary.json
Read `references/output-schemas.md` for the exact shape. Generate:
- A concise headline summarizing the overall disaster landscape
- A 2-3 sentence summary of the most significant findings
- 3-5 key insights drawn from patterns in the data (most affected regions,
  escalating event types, severity trends)
- An overall risk score based on event count, severity distribution, and population impact
- A severity level: "red" if any critical events, "orange" if elevated activity, "green" if routine

#### disasterSeverity.json
Take `_parsed_events.json` and enrich each event:
- Write an `aiSummary` for each event (1-2 sentences contextualizing the event)
- Extract `populationExposed` from the summary text where available
- Set `alertLevel` based on the title's color indicator (Red/Orange/Green)
- Sort by severity (red first, then orange, then green)

#### regionalRiskHeatmap.json
Take `_regional_aggregation.json` and produce `RegionalRisk[]`:
- Calculate `riskScore` (0-100) from: event count, highest severity, total severity values
- Identify `dominantDisasterType` per region
- Sort by riskScore descending

#### disasterTrendAnalyzer.json
Take `_daily_trends.json` and produce `TrendDataPoint[]`:
- Count events per day
- Break down severity per day (red/orange/green counts)
- Identify dominant disaster type per day
- Sort chronologically

#### recentEvents.json
Take `_parsed_events.json`, sort by date descending, and return the most recent 10-15 events
as `DisasterEvent[]`. These populate the Recent Events table on the dashboard.

### Step 4: Save and confirm

Save all five JSON files to the dataset subfolder (e.g. `documents/cleanDataset/GDACS-RSS-Information/`).
Report to the user:
- How many events were processed
- How many regions identified
- Date range covered
- Any data quality issues (missing fields, unparseable rows)
- The severity level of the overall analysis

## Severity Classification Rules

The GDACS title field contains a color indicator. Map these consistently:

| Title contains | alertLevel | Meaning |
|----------------|------------|---------|
| "Red" | "red" | Critical — immediate humanitarian concern |
| "Orange" | "orange" | Elevated — significant impact, monitoring needed |
| "Green" | "green" | Advisory — low impact, routine monitoring |
| (none/unknown) | "neutral" | Unclassified |

## Risk Score Calculation

For regional risk scores, use this weighted formula:
- Event count contribution: `min(eventCount * 8, 40)` (max 40 points)
- Severity contribution: 30 points if any red, 20 if orange, 10 if green only
- Severity value factor: `min(maxSeverityValue / highestPossible * 30, 30)` (max 30 points)

This yields a 0-100 scale where higher means more risk.

## Handling Non-GDACS Data

If the CSV doesn't match GDACS columns exactly, adapt:
1. Look for columns that map to: event ID, location, event type, severity, dates, coordinates
2. Map whatever is available to the output schemas
3. Leave optional fields empty rather than guessing
4. Note any mapping issues in the output summary
