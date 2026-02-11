# DASHBOARD TEMPLATE SPECIFICATION
Project: Global Disaster Intelligence Dashboard
Framework: React (or Next.js preferred)
Purpose: Create a reusable dashboard layout template for AI-powered disaster analysis modules.

--------------------------------------------------
## 1. OVERALL LAYOUT STRUCTURE

The dashboard must follow a clean, modular, intelligence-style layout.

Layout Structure:

- Top Navigation Bar
    - Project Name (Global Disaster Intelligence)
    - Upload CSV Button
    - Date / Last Updated Indicator

- Main Dashboard Grid (3 Primary Segments)
    1. Disaster Severity
    2. Regional Risk Heatmap
    3. Disaster Trend Analyzer

Use responsive grid layout (3-column desktop, stacked mobile).

--------------------------------------------------
## 2. CARD TEMPLATE STANDARD

All dashboard segments must use the same base card template.

Each card must contain:

- Title
- Short AI-generated summary (max 3 lines)
- Severity Indicator (color-coded badge)
- Key Metrics Section
- "View Details" Button
- Last Updated Timestamp

Card Design Requirements:
- Clean modern UI
- Subtle shadow
- Rounded corners
- Status color indicator (Red, Orange, Green, Neutral)
- Loading state placeholder
- Error state placeholder

--------------------------------------------------
## 3. SEGMENT 1: DISASTER SEVERITY

Purpose:
Display most critical current disaster event.

Data Required:
- Event Name
- Country
- Alert Level
- Population Exposed
- Event Type
- AI Summary

Card Metrics:
- Alert Level Badge
- Population Exposed
- Event Type

On Click:
Navigate to:
    /disaster/[event-id]

Detail Page Template Should Include:
- Full event metadata
- AI-generated detailed analysis
- Timeline
- Geographic coordinates
- Impact breakdown

--------------------------------------------------
## 4. SEGMENT 2: REGIONAL RISK HEATMAP

Purpose:
Display risk concentration by region.

Data Required:
- Region/Country
- Number of Events
- Highest Severity in Region
- Risk Score

Card Metrics:
- Top 3 High Risk Regions
- Total Active Events
- Dominant Disaster Type

On Click:
Navigate to:
    /regional-analysis

Detail Page Should Include:
- Ranked regional list
- Severity distribution chart
- Event clustering summary
- AI-generated regional insight

--------------------------------------------------
## 5. SEGMENT 3: DISASTER TREND ANALYZER

Purpose:
Analyze disaster activity over time.

Data Required:
- Events grouped by date
- Event count per day
- Severity distribution over time
- Disaster type frequency

Card Metrics:
- 7-day trend direction
- 30-day comparison
- Most frequent disaster type

On Click:
Navigate to:
    /trend-analysis

Detail Page Should Include:
- Time-series chart
- Event breakdown by type
- Escalation detection
- AI-generated trend analysis

--------------------------------------------------
## 6. CSV UPLOAD WORKFLOW

Upload Flow:
1. User uploads GDACS CSV file.
2. System parses CSV into structured JSON.
3. Data is stored temporarily in state or backend.
4. User can trigger specific AI Skills per segment.
5. Skill output populates corresponding card.

--------------------------------------------------
## 7. SKILL INTEGRATION STANDARD

Each segment must support:

- Loading State (While skill is running)
- Success State (Structured JSON result)
- Error State (Skill failure message)

Expected Skill Output Format:

{
  "headline": "",
  "summary": "",
  "severityLevel": "",
  "keyInsights": [],
  "riskScore": "",
  "generatedAt": ""
}

Dashboard must not break if fields are missing.
Graceful fallback required.

--------------------------------------------------
## 8. UI DESIGN PRINCIPLES

- Clean intelligence dashboard aesthetic
- Dark mode preferred
- Clear hierarchy
- Minimal clutter
- Strong contrast for alert levels
- Consistent typography scale

--------------------------------------------------
## 9. NON-FUNCTIONAL REQUIREMENTS

- Responsive layout
- Reusable Card component
- Modular segment components
- Type-safe props (if using TypeScript)
- Scalable for adding more AI Skills later

--------------------------------------------------
## 10. OUTPUT EXPECTATION

Generate:
- Component structure
- Layout skeleton
- Reusable Card component
- Route structure
- Placeholder dummy data
- Clear folder architecture

Do NOT generate business logic.
Only generate layout + placeholder UI.
