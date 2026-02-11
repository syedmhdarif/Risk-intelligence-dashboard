#!/usr/bin/env python3
"""
Parse GDACS-format disaster CSV into structured intermediate JSON files.

Usage:
    python3 parse_csv.py <csv_path> [output_dir]

Produces three intermediate files in output_dir:
    _parsed_events.json         - All events as DisasterEvent-shaped objects
    _regional_aggregation.json  - Events aggregated by country/region
    _daily_trends.json          - Events grouped by date
"""

import csv
import json
import re
import sys
import os
from datetime import datetime
from collections import defaultdict


def parse_date(date_str: str) -> str | None:
    """Parse various date formats into YYYY-MM-DD."""
    if not date_str or date_str.strip() == "":
        return None

    date_str = date_str.strip()

    # Try RFC 2822 format: "Tue, 10 Feb 2026 21:14:42 GMT"
    for fmt in [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y-%m-%dT%H:%M:%S",
    ]:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Last resort: try dateutil if available
    try:
        from dateutil import parser as dateutil_parser
        return dateutil_parser.parse(date_str).strftime("%Y-%m-%d")
    except Exception:
        return None


def extract_alert_level(title: str, summary: str = "") -> str:
    """Extract severity color from GDACS title or summary field.

    Most events have the color in the title (e.g. 'Green earthquake...').
    Drought events have it in the summary ('notification level is Orange').
    """
    title_lower = title.lower()
    if "red " in title_lower or title_lower.startswith("red"):
        return "red"
    elif "orange " in title_lower or title_lower.startswith("orange"):
        return "orange"
    elif "green " in title_lower or title_lower.startswith("green"):
        return "green"

    # Check summary for drought-style notification levels
    if summary:
        summary_lower = summary.lower()
        level_match = re.search(r"notification level is (\w+)", summary_lower)
        if level_match:
            level = level_match.group(1)
            if level == "red":
                return "red"
            elif level == "orange":
                return "orange"
            elif level == "green":
                return "green"

    return "neutral"


def extract_population(summary: str) -> str:
    """Extract population exposure from event summary text."""
    # Match patterns like "230 thousand", "1.754 million", "6555"
    patterns = [
        r"affecting\s+([\d,.]+\s*million)",
        r"affecting\s+([\d,.]+\s*thousand)",
        r"affecting\s+([\d,.]+)",
        r"population[^:]*?(?:is|of)\s+([\d,.]+\s*(?:million|thousand)?)",
        r"(\d+)\s+deaths?\s+and\s+([\d,]+)\s+displaced",
    ]

    for pattern in patterns:
        match = re.search(pattern, summary, re.IGNORECASE)
        if match:
            groups = match.groups()
            if len(groups) == 2:  # deaths and displaced pattern
                displaced = groups[1].replace(",", "")
                if int(displaced) > 0:
                    return f"{displaced} displaced"
                return f"{groups[0]} deaths"
            value = groups[0].strip()
            # Format nicely
            if "million" in value.lower():
                return value.title()
            elif "thousand" in value.lower():
                return value.title()
            else:
                try:
                    num = int(value.replace(",", ""))
                    if num >= 1_000_000:
                        return f"{num / 1_000_000:.1f}M"
                    elif num >= 1_000:
                        return f"{num / 1_000:.0f}K"
                    return str(num)
                except ValueError:
                    return value

    return "Unknown"


def safe_float(value: str) -> float:
    """Safely convert string to float, returning 0.0 on failure."""
    try:
        return float(value.strip())
    except (ValueError, AttributeError):
        return 0.0


def parse_csv_file(csv_path: str) -> list[dict]:
    """Read and parse the CSV file, returning list of raw row dicts."""
    rows = []

    # Try to detect encoding
    encodings = ["utf-8-sig", "utf-8", "latin-1", "cp1252"]

    for encoding in encodings:
        try:
            with open(csv_path, "r", encoding=encoding) as f:
                # Skip comment rows starting with #
                lines = [line for line in f if not line.startswith("#")]

            reader = csv.DictReader(lines)
            for row in reader:
                rows.append(row)
            break
        except (UnicodeDecodeError, csv.Error):
            continue

    if not rows:
        print(f"ERROR: Could not parse CSV file: {csv_path}", file=sys.stderr)
        sys.exit(1)

    return rows


def detect_csv_format(rows: list[dict]) -> str:
    """Detect whether the CSV is GDACS RSS format or alternative format."""
    if not rows:
        return "unknown"
    first_row = rows[0]
    # GDACS RSS has 'id', 'title', 'summary', 'event_type', 'geo_lat', 'geo_long'
    if "id" in first_row and "title" in first_row and "event_type" in first_row:
        return "gdacs_rss"
    # Alternative format has 'description', 'alertlevel', 'Earthquake Magnitude (M)'
    if "description" in first_row and "alertlevel" in first_row:
        return "gdacs_alt"
    return "unknown"


def extract_event_type_from_description(desc: str) -> str:
    """Extract disaster type from description text."""
    desc_lower = desc.lower()
    if "earthquake" in desc_lower:
        return "Earthquake"
    elif "flood" in desc_lower:
        return "Flood"
    elif "cyclone" in desc_lower or "typhoon" in desc_lower or "hurricane" in desc_lower:
        return "Tropical Cyclone"
    elif "wildfire" in desc_lower or "fire" in desc_lower:
        return "Wildfire"
    elif "drought" in desc_lower:
        return "Drought"
    elif "volcano" in desc_lower or "eruption" in desc_lower:
        return "Volcano"
    elif "tsunami" in desc_lower:
        return "Tsunami"
    elif "storm" in desc_lower:
        return "Storm"
    return "Unknown"


def format_population(pop_value: float) -> str:
    """Format a numeric population value into a human-readable string."""
    if pop_value < 0:
        return "Unknown"
    if pop_value == 0:
        return "0"
    if pop_value >= 1_000_000:
        return f"{pop_value / 1_000_000:.1f} Million"
    if pop_value >= 1_000:
        return f"{pop_value / 1_000:.0f} Thousand"
    return str(int(pop_value))


def build_parsed_events(rows: list[dict]) -> list[dict]:
    """Convert raw CSV rows to DisasterEvent-shaped objects.

    Supports both GDACS RSS format and alternative GDACS earthquake format.
    """
    events = []
    csv_format = detect_csv_format(rows)

    for idx, row in enumerate(rows):
        if csv_format == "gdacs_alt":
            # Alternative format: description, alertlevel, fromdate, todate, etc.
            title = row.get("description", "").strip()
            if not title:
                continue

            event_id = f"EV{idx + 1:06d}"
            alert_level_raw = row.get("alertlevel", "").strip().lower()
            alert_level = alert_level_raw if alert_level_raw in ("red", "orange", "green") else extract_alert_level(title)
            from_date = parse_date(row.get("fromdate", ""))
            to_date = parse_date(row.get("todate", ""))
            lat = safe_float(row.get("latitude", "0"))
            lng = safe_float(row.get("longitude", "0"))
            magnitude = safe_float(row.get("Earthquake Magnitude (M)", "0"))
            pop_exposed_raw = safe_float(row.get("Exposed Population (within 100 km)", "-1"))
            depth = safe_float(row.get("Depth (km)", "0"))
            event_type = extract_event_type_from_description(title)

            event = {
                "id": event_id,
                "eventName": title,
                "country": row.get("country", "").strip(),
                "iso3": row.get("iso3", "").strip(),
                "alertLevel": alert_level,
                "populationExposed": format_population(pop_exposed_raw),
                "eventType": event_type,
                "aiSummary": "",
                "date": from_date or "",
                "endDate": to_date or "",
                "coordinates": {"lat": lat, "lng": lng} if lat != 0 or lng != 0 else None,
                "severityUnit": "M" if event_type == "Earthquake" else "",
                "severityValue": magnitude,
                "source": row.get("source", "").strip(),
                "link": "",
                "rawSummary": "",
                "rawTitle": title,
                "depth": depth,
            }
        else:
            # Standard GDACS RSS format
            event_id = row.get("id", "").strip()
            if not event_id:
                continue

            title = row.get("title", "").strip()
            summary = row.get("summary", "").strip()
            from_date = parse_date(row.get("from_date", ""))
            to_date = parse_date(row.get("to_date", ""))
            lat = safe_float(row.get("geo_lat", "0"))
            lng = safe_float(row.get("geo_long", "0"))

            event = {
                "id": event_id,
                "eventName": title,
                "country": row.get("country", "").strip(),
                "iso3": row.get("iso3", "").strip(),
                "alertLevel": extract_alert_level(title, summary),
                "populationExposed": extract_population(summary),
                "eventType": row.get("event_type", "").strip(),
                "aiSummary": "",
                "date": from_date or "",
                "endDate": to_date or "",
                "coordinates": {"lat": lat, "lng": lng} if lat != 0 or lng != 0 else None,
                "severityUnit": row.get("severity_unit", "").strip(),
                "severityValue": safe_float(row.get("severity_value", "0")),
                "source": row.get("source", "").strip(),
                "link": row.get("link", "").strip(),
                "rawSummary": summary,
                "rawTitle": title,
            }

        events.append(event)

    # Sort by: red first, then orange, then green, then by severity value descending
    severity_order = {"red": 0, "orange": 1, "green": 2, "neutral": 3}
    events.sort(key=lambda e: (severity_order.get(e["alertLevel"], 3), -e["severityValue"]))

    return events


def build_regional_aggregation(events: list[dict]) -> list[dict]:
    """Aggregate events by country into regional risk summaries."""
    regions: dict[str, dict] = defaultdict(lambda: {
        "region": "",
        "events": [],
        "eventCount": 0,
        "severityValues": [],
        "alertLevels": [],
        "eventTypes": [],
    })

    for event in events:
        country = event["country"]
        if not country:
            continue

        # Use first country if multiple are listed
        primary_country = country.split(",")[0].strip()

        region_data = regions[primary_country]
        region_data["region"] = primary_country
        region_data["events"].append(event["id"])
        region_data["eventCount"] += 1
        region_data["severityValues"].append(event["severityValue"])
        region_data["alertLevels"].append(event["alertLevel"])
        region_data["eventTypes"].append(event["eventType"])

    aggregated = []
    for country, data in regions.items():
        # Determine highest severity
        severity_priority = {"red": 0, "orange": 1, "green": 2, "neutral": 3}
        highest = min(data["alertLevels"], key=lambda x: severity_priority.get(x, 3))

        # Find dominant disaster type
        type_counts: dict[str, int] = defaultdict(int)
        for t in data["eventTypes"]:
            if t:
                type_counts[t] += 1
        dominant_type = max(type_counts, key=type_counts.get) if type_counts else "Unknown"

        # Max severity value for risk score calculation
        max_severity = max(data["severityValues"]) if data["severityValues"] else 0

        aggregated.append({
            "region": country,
            "eventCount": data["eventCount"],
            "highestSeverity": highest,
            "maxSeverityValue": max_severity,
            "dominantDisasterType": dominant_type,
            "eventIds": data["events"],
            "alertLevels": data["alertLevels"],
        })

    # Sort by event count descending
    aggregated.sort(key=lambda r: (-r["eventCount"], r["region"]))

    return aggregated


def build_daily_trends(events: list[dict]) -> list[dict]:
    """Group events by start date for trend analysis."""
    daily: dict[str, dict] = defaultdict(lambda: {
        "date": "",
        "events": [],
        "eventCount": 0,
        "alertLevels": [],
        "eventTypes": [],
    })

    for event in events:
        date = event.get("date", "")
        if not date:
            continue

        day_data = daily[date]
        day_data["date"] = date
        day_data["events"].append(event["id"])
        day_data["eventCount"] += 1
        day_data["alertLevels"].append(event["alertLevel"])
        day_data["eventTypes"].append(event["eventType"])

    trends = []
    for date, data in sorted(daily.items()):
        # Count severity breakdown
        red_count = data["alertLevels"].count("red")
        orange_count = data["alertLevels"].count("orange")
        green_count = data["alertLevels"].count("green") + data["alertLevels"].count("neutral")

        # Find dominant type for the day
        type_counts: dict[str, int] = defaultdict(int)
        for t in data["eventTypes"]:
            if t:
                type_counts[t] += 1
        dominant = max(type_counts, key=type_counts.get) if type_counts else "Unknown"

        trends.append({
            "date": date,
            "eventCount": data["eventCount"],
            "severityBreakdown": {
                "red": red_count,
                "orange": orange_count,
                "green": green_count,
            },
            "dominantType": dominant,
            "eventIds": data["events"],
        })

    return trends


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 parse_csv.py <csv_path> [output_base_dir]", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]
    output_base = sys.argv[2] if len(sys.argv) > 2 else "documents/cleanDataset"

    if not os.path.isfile(csv_path):
        print(f"ERROR: File not found: {csv_path}", file=sys.stderr)
        sys.exit(1)

    # Create a subfolder named after the CSV file (without extension)
    # e.g. "GDACS-RSS-Information.csv" → "documents/cleanDataset/GDACS-RSS-Information/"
    csv_basename = os.path.splitext(os.path.basename(csv_path))[0]
    output_dir = os.path.join(output_base, csv_basename)
    os.makedirs(output_dir, exist_ok=True)

    print(f"Dataset folder: {output_dir}")

    print(f"Parsing CSV: {csv_path}")
    rows = parse_csv_file(csv_path)
    print(f"  Found {len(rows)} rows")

    # Build structured data
    events = build_parsed_events(rows)
    print(f"  Parsed {len(events)} valid events")

    regional = build_regional_aggregation(events)
    print(f"  Aggregated into {len(regional)} regions")

    trends = build_daily_trends(events)
    print(f"  Built {len(trends)} daily trend points")

    # Date range
    dates = [e["date"] for e in events if e["date"]]
    if dates:
        print(f"  Date range: {min(dates)} to {max(dates)}")

    # Event type breakdown
    type_counts: dict[str, int] = defaultdict(int)
    for e in events:
        if e["eventType"]:
            type_counts[e["eventType"]] += 1
    print(f"  Event types: {dict(type_counts)}")

    # Severity breakdown
    sev_counts: dict[str, int] = defaultdict(int)
    for e in events:
        sev_counts[e["alertLevel"]] += 1
    print(f"  Severity: {dict(sev_counts)}")

    # Write intermediate files
    events_path = os.path.join(output_dir, "_parsed_events.json")
    with open(events_path, "w") as f:
        json.dump(events, f, indent=2)
    print(f"  Wrote: {events_path}")

    regional_path = os.path.join(output_dir, "_regional_aggregation.json")
    with open(regional_path, "w") as f:
        json.dump(regional, f, indent=2)
    print(f"  Wrote: {regional_path}")

    trends_path = os.path.join(output_dir, "_daily_trends.json")
    with open(trends_path, "w") as f:
        json.dump(trends, f, indent=2)
    print(f"  Wrote: {trends_path}")

    print("\nIntermediate parsing complete. Ready for AI enrichment.")


if __name__ == "__main__":
    main()
