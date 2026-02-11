# Output JSON Schemas

These schemas match the TypeScript interfaces in `lib/types.ts`. The dashboard components
consume these exact shapes.

---

## 1. analysisSummary.json

Overall intelligence summary for the dashboard header and overview.

```json
{
  "headline": "string — concise 1-line summary of the disaster landscape",
  "summary": "string — 2-3 sentence overview of the most significant findings",
  "severityLevel": "red | orange | green | neutral",
  "keyInsights": [
    "string — insight about patterns, affected regions, escalating threats (3-5 items)"
  ],
  "riskScore": "string — overall score like '72/100' or 'High'",
  "generatedAt": "string — ISO 8601 timestamp",
  "metadata": {
    "totalEvents": "number",
    "dateRange": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
    "eventTypes": { "Earthquake": 5, "Flood": 3 },
    "severityDistribution": { "red": 1, "orange": 3, "green": 15 }
  }
}
```

**TypeScript interface**: `SkillOutput` (plus `metadata` extension)

---

## 2. disasterSeverity.json

Array of all disaster events, sorted by severity (red first).

```json
[
  {
    "id": "EQ1523937",
    "eventName": "Green earthquake (Magnitude 5.6M) in Tonga",
    "country": "Tonga",
    "alertLevel": "red | orange | green | neutral",
    "populationExposed": "230 Thousand",
    "eventType": "Earthquake",
    "aiSummary": "AI-generated 1-2 sentence contextual summary",
    "date": "2026-02-10",
    "coordinates": { "lat": -14.97, "lng": -172.94 },
    "timeline": [
      { "date": "2026-02-10", "description": "Event detected" }
    ],
    "impactBreakdown": [
      { "category": "Population Exposed", "value": "230K" },
      { "category": "Magnitude", "value": "5.6M" }
    ],
    "detailedAnalysis": "AI-generated multi-sentence analysis"
  }
]
```

**TypeScript interface**: `DisasterEvent[]`

Key fields:
- `id`: From CSV `id` column
- `alertLevel`: Derived from title color (Red/Orange/Green)
- `populationExposed`: Extracted from summary text
- `aiSummary`: AI-generated (not in CSV — the skill generates this)
- `timeline`: Optional, constructed from from_date/to_date
- `impactBreakdown`: Optional, extracted from summary details
- `detailedAnalysis`: Optional, AI-generated deeper analysis

---

## 3. regionalRiskHeatmap.json

Array of regional risk assessments, sorted by riskScore descending.

```json
[
  {
    "region": "Central African Republic",
    "eventCount": 15,
    "highestSeverity": "orange",
    "riskScore": 78,
    "dominantDisasterType": "Wildfire"
  }
]
```

**TypeScript interface**: `RegionalRisk[]`

Key fields:
- `region`: Country or region name
- `eventCount`: Total events in this region
- `highestSeverity`: Most severe alert level in region
- `riskScore`: 0-100 calculated score (see SKILL.md for formula)
- `dominantDisasterType`: Most frequent event type in region

---

## 4. disasterTrendAnalyzer.json

Array of daily data points for time-series trend analysis.

```json
[
  {
    "date": "2026-02-10",
    "eventCount": 5,
    "severityBreakdown": {
      "red": 0,
      "orange": 1,
      "green": 4
    },
    "dominantType": "Wildfire"
  }
]
```

**TypeScript interface**: `TrendDataPoint[]`

Key fields:
- `date`: YYYY-MM-DD format
- `eventCount`: Total events that started on this date
- `severityBreakdown`: Count of events by severity level
- `dominantType`: Most frequent event type for that day
- Sorted chronologically (earliest first)

---

## 5. recentEvents.json

Array of the most recent 10-15 events for the Recent Events table.

```json
[
  {
    "id": "EQ1523937",
    "eventName": "Green earthquake (Magnitude 5.6M) in Tonga",
    "country": "Tonga",
    "alertLevel": "green",
    "populationExposed": "230 Thousand",
    "eventType": "Earthquake",
    "aiSummary": "A moderate earthquake struck Tonga with limited population exposure.",
    "date": "2026-02-10",
    "coordinates": { "lat": -14.97, "lng": -172.94 }
  }
]
```

**TypeScript interface**: `DisasterEvent[]` (subset of fields)

Sorted by date descending (most recent first). The dashboard table uses:
- `eventName` — Event column
- `country` — Country column
- `eventType` — Type column
- `alertLevel` — Alert indicator dot
- `date` — Date column
