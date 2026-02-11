#!/usr/bin/env python3
"""
End-to-end pipeline: process all CSV files from rawData/ into dashboard-ready
JSON files in public/data/.

Usage:
    python3 scripts/process-data.py                  # process all CSVs
    python3 scripts/process-data.py <file.csv>       # process a single CSV

Pipeline per CSV:
    1. parse_csv.py  → intermediate JSON in documents/cleanDataset/<name>/
    2. generate enriched final JSON files (5 files)
    3. copy to public/data/<name>/
    4. rebuild public/data/datasets.json manifest
"""

import json
import math
import os
import re
import shutil
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(ROOT, "documents", "rawData")
CLEAN_DIR = os.path.join(ROOT, "documents", "cleanDataset")
PUBLIC_DIR = os.path.join(ROOT, "public", "data")
PARSE_SCRIPT = os.path.join(
    ROOT, ".claude", "skills", "disaster-data-analyzer", "scripts", "parse_csv.py"
)


# ─── helpers ────────────────────────────────────────────────────────────────

def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def fmt_pop(val):
    if val is None or val < 0:
        return "Unknown"
    if val == 0:
        return "0"
    if val >= 1_000_000:
        return f"{val / 1_000_000:.1f} Million"
    if val >= 1_000:
        return f"{val / 1_000:.0f} Thousand"
    return str(int(val))


# ─── detect dataset type from events ────────────────────────────────────────

def detect_dataset_type(events):
    """Detect whether dataset is earthquake, eruption, or mixed from events."""
    type_counts = Counter(e.get("eventType", "") for e in events)
    if not type_counts:
        return "mixed"
    dominant = type_counts.most_common(1)[0][0]
    if dominant == "Earthquake":
        return "earthquake"
    elif dominant == "Volcano":
        return "eruption"
    return "mixed"


# ─── AI summary generators ─────────────────────────────────────────────────

def _earthquake_summary(e):
    mag = e["severityValue"]
    country = e["country"] or "offshore location"
    alert = e["alertLevel"]
    pop = e["populationExposed"]
    depth = e.get("depth", 0)
    date = e["date"]
    desc = (
        "catastrophic" if mag >= 8 else "major" if mag >= 7 else "strong"
        if mag >= 6 else "moderate" if mag >= 5 else "light" if mag >= 4 else "minor"
    )
    depth_note = (
        " at shallow depth, increasing potential surface damage" if 0 < depth <= 20
        else " at intermediate depth" if 0 < depth <= 70
        else " at deep focus, reducing surface impact" if depth > 300
        else ""
    )
    pop_note = (
        f" with approximately {pop} people within 100 km"
        if pop and pop not in ("Unknown", "0", "-1") else ""
    )
    if alert == "red":
        return (f"A {desc} M{mag} earthquake struck {country} on {date}{depth_note}"
                f"{pop_note}. This critical-level event required immediate humanitarian "
                f"assessment and response coordination.")
    elif alert == "orange":
        return (f"A {desc} M{mag} earthquake was recorded in {country} on {date}"
                f"{depth_note}{pop_note}. Elevated-severity event warranting close "
                f"monitoring for aftershock activity.")
    return f"A {desc} M{mag} earthquake occurred in {country} on {date}{depth_note}{pop_note}."


def _eruption_summary(e):
    country = e["country"] or "an unspecified region"
    alert = e["alertLevel"]
    pop = e["populationExposed"]
    vei = e.get("vei")
    pop_30 = e.get("populationExposed30km", "Unknown")
    date = e["date"]
    end = e.get("endDate", "")
    m = re.search(r"Eruption\s+(.+?)\s+in\s+", e["eventName"])
    name = m.group(1) if m else "Unknown Volcano"

    vei_note = ""
    if vei is not None and vei >= 0:
        vei_note = (
            f" with an extremely high VEI of {int(vei)}" if vei >= 6
            else f" with a significant VEI of {int(vei)}" if vei >= 4
            else f" with a VEI of {int(vei)}" if vei >= 2
            else f" with a low VEI of {int(vei)}"
        )
    dur = f", continuing through {end}" if end and end != date else ""
    pop_note = ""
    if pop and pop not in ("Unknown", "0"):
        pop_note = f" Approximately {pop} people reside within 100km"
        if pop_30 and pop_30 not in ("Unknown", "0"):
            pop_note += f", with {pop_30} within the critical 30km zone"
        pop_note += "."
    if alert == "red":
        return (f"A critical eruption of {name} in {country} began on {date}{dur}"
                f"{vei_note}. Immediate evacuation advisories issued.{pop_note}")
    elif alert == "orange":
        return (f"An elevated-alert eruption of {name} in {country} detected on {date}"
                f"{dur}{vei_note}. Heightened monitoring for escalation.{pop_note}")
    return (f"An advisory-level eruption of {name} in {country} recorded on {date}"
            f"{dur}{vei_note}.{pop_note}")


def _mixed_summary(e):
    etype = e.get("eventType", "")
    country = e.get("country", "Unknown")
    sev = e.get("severityValue", 0)
    unit = e.get("severityUnit", "")
    pop = e.get("populationExposed", "Unknown")
    alert = e.get("alertLevel", "green")

    if etype == "Tropical Cyclone":
        return (f"Tropical cyclone with max winds of {sev:.0f} {unit} affecting {country}. "
                f"Population exposed: {pop}. "
                f"{'Critical situation requiring immediate response.' if alert == 'red' else 'Monitoring ongoing.'}")
    elif etype == "Earthquake":
        return _earthquake_summary(e)
    elif etype == "Flood":
        return f"Flooding reported in {country}. Population exposed: {pop}. Monitoring for further escalation."
    elif etype == "Wildfire":
        area = f"{sev:,.0f}" if sev else "unknown"
        return f"Wildfire activity in {country} affecting approximately {area} hectares."
    elif etype == "Drought":
        area = f"{sev:,.0f}" if sev else "unknown"
        return f"Drought conditions in {country} affecting ~{area} km\u00b2."
    elif etype == "Volcano":
        return _eruption_summary(e)
    return f"Disaster event reported in {country}. Monitoring in progress."


def generate_ai_summary(e, dtype):
    if dtype == "earthquake":
        return _earthquake_summary(e)
    elif dtype == "eruption":
        return _eruption_summary(e)
    return _mixed_summary(e)


# ─── risk score ─────────────────────────────────────────────────────────────

def risk_score_for_region(region, dtype):
    ec = region["eventCount"]
    highest = region["highestSeverity"]
    max_sev = region["maxSeverityValue"]

    count_score = min(ec * 8, 40)
    sev_map = {"red": 30, "orange": 20, "green": 10, "neutral": 5}
    sev_score = sev_map.get(highest, 5)

    if dtype == "earthquake":
        val_score = min(max_sev / 9.5 * 30, 30)
    elif dtype == "eruption":
        val_score = min(max_sev / 8.0 * 30, 30) if max_sev > 0 else 0
    else:
        val_score = min(math.log10(max_sev + 1) / 6 * 30, 30) if max_sev > 0 else 0

    return min(round(count_score + sev_score + val_score), 100)


# ─── generate the 5 final files ────────────────────────────────────────────

def generate_all(dataset_dir):
    events = load_json(os.path.join(dataset_dir, "_parsed_events.json"))
    regions = load_json(os.path.join(dataset_dir, "_regional_aggregation.json"))
    trends = load_json(os.path.join(dataset_dir, "_daily_trends.json"))

    dtype = detect_dataset_type(events)
    total = len(events)
    dates = [e["date"] for e in events if e["date"]]
    date_from = min(dates) if dates else ""
    date_to = max(dates) if dates else ""
    type_counts = Counter(e.get("eventType", "Unknown") for e in events)
    sev_counts = {"red": 0, "orange": 0, "green": 0}
    for e in events:
        lvl = e.get("alertLevel", "green")
        if lvl in sev_counts:
            sev_counts[lvl] += 1

    red = sev_counts["red"]
    orange = sev_counts["orange"]
    green = sev_counts["green"]
    overall_sev = "red" if red else ("orange" if orange else "green")
    dominant_type = type_counts.most_common(1)[0][0] if type_counts else "Unknown"
    top_regions = sorted(regions, key=lambda r: -r["eventCount"])[:5]

    # ── 1. analysisSummary.json ──
    headline = (
        f"{total:,} {dominant_type} Events Across {len(regions)} Regions "
        f"({date_from[:4]}\u2013{date_to[:4]})"
    )
    region_names = ", ".join(r["region"] for r in top_regions[:3])
    summary_text = (
        f"This dataset documents {total:,} {dominant_type.lower()} events from "
        f"{date_from} to {date_to} across {len(regions)} distinct regions. "
        f"{red} critical (red) and {orange} elevated (orange) alerts were recorded. "
        f"Top affected regions: {region_names}."
    )
    # Key insights
    insights = []
    insights.append(
        f"{top_regions[0]['region']} leads with {top_regions[0]['eventCount']:,} events "
        f"({top_regions[0]['eventCount'] / total * 100:.1f}% of total), followed by "
        f"{top_regions[1]['region']} ({top_regions[1]['eventCount']:,}) and "
        f"{top_regions[2]['region']} ({top_regions[2]['eventCount']:,})."
        if len(top_regions) >= 3 else
        f"{top_regions[0]['region']} leads with {top_regions[0]['eventCount']:,} events."
    )
    if red:
        red_events = [e for e in events if e["alertLevel"] == "red"]
        insights.append(
            f"{red} critical-level events identified, the most severe being "
            f"{red_events[0]['eventName'][:80]}."
        )
    if orange:
        insights.append(
            f"{orange} elevated (orange) alert events requiring close monitoring across "
            f"multiple regions."
        )
    insights.append(
        f"{green / total * 100:.1f}% of events are advisory (green) level, but "
        f"the {red + orange} elevated-or-higher events represent significant cumulative risk."
    )

    overall_risk = min(round(
        min(red * 2, 30) + min(orange * 0.15, 20) +
        min(total / 500, 30) +
        min(events[0]["severityValue"] / 10 * 20, 20) if events else 0
    ), 100)

    analysis = {
        "headline": headline,
        "summary": summary_text,
        "severityLevel": overall_sev,
        "keyInsights": insights,
        "riskScore": f"{overall_risk}/100",
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "metadata": {
            "totalEvents": total,
            "dateRange": {"from": date_from, "to": date_to},
            "eventTypes": dict(type_counts),
            "severityDistribution": sev_counts,
        },
    }
    save_json(os.path.join(dataset_dir, "analysisSummary.json"), analysis)

    # ── 2. disasterSeverity.json ──
    severity_out = []
    for e in events:
        enriched = {
            "id": e["id"],
            "eventName": e.get("rawTitle") or e["eventName"],
            "country": e["country"],
            "alertLevel": e["alertLevel"],
            "populationExposed": e["populationExposed"],
            "eventType": e["eventType"],
            "aiSummary": generate_ai_summary(e, dtype),
            "date": e["date"],
            "coordinates": e.get("coordinates"),
            "timeline": [{"date": e["date"], "description": "Event detected"}],
            "impactBreakdown": [],
            "detailedAnalysis": generate_ai_summary(e, dtype),
        }
        if e["severityValue"]:
            unit_labels = {"M": "Magnitude", "VEI": "Volcanic Explosivity Index",
                           "km/h": "Wind Speed", "ha": "Area (ha)", "km2": "Area (km\u00b2)"}
            label = unit_labels.get(e.get("severityUnit", ""), "Severity")
            enriched["impactBreakdown"].append(
                {"category": label, "value": f"{e['severityValue']} {e.get('severityUnit', '')}"}
            )
        if e.get("depth", 0) > 0:
            enriched["impactBreakdown"].append({"category": "Depth", "value": f"{e['depth']} km"})
        if e.get("vei") is not None and e["vei"] >= 0:
            enriched["impactBreakdown"].append({"category": "VEI", "value": str(int(e["vei"]))})
        if e.get("pei") is not None and e["pei"] >= 0:
            enriched["impactBreakdown"].append({"category": "PEI", "value": str(int(e["pei"]))})
        if e["populationExposed"] not in ("Unknown", "0", ""):
            enriched["impactBreakdown"].append(
                {"category": "Population Exposed", "value": e["populationExposed"]}
            )
        if e.get("endDate") and e["endDate"] != e["date"]:
            enriched["timeline"].append({"date": e["endDate"], "description": "Latest recorded activity"})
        severity_out.append(enriched)
    save_json(os.path.join(dataset_dir, "disasterSeverity.json"), severity_out)

    # ── 3. regionalRiskHeatmap.json ──
    heatmap = []
    for r in regions:
        heatmap.append({
            "region": r["region"],
            "eventCount": r["eventCount"],
            "highestSeverity": r["highestSeverity"],
            "riskScore": risk_score_for_region(r, dtype),
            "dominantDisasterType": r["dominantDisasterType"],
        })
    heatmap.sort(key=lambda x: -x["riskScore"])
    save_json(os.path.join(dataset_dir, "regionalRiskHeatmap.json"), heatmap)

    # ── 4. disasterTrendAnalyzer.json ──
    trend_out = [
        {"date": t["date"], "eventCount": t["eventCount"],
         "severityBreakdown": t["severityBreakdown"], "dominantType": t["dominantType"]}
        for t in trends
    ]
    save_json(os.path.join(dataset_dir, "disasterTrendAnalyzer.json"), trend_out)

    # ── 5. recentEvents.json ──
    by_date = sorted(events, key=lambda e: e.get("date", ""), reverse=True)
    recent = []
    for e in by_date[:15]:
        recent.append({
            "id": e["id"],
            "eventName": e.get("rawTitle") or e["eventName"],
            "country": e["country"],
            "alertLevel": e["alertLevel"],
            "populationExposed": e["populationExposed"],
            "eventType": e["eventType"],
            "aiSummary": generate_ai_summary(e, dtype),
            "date": e["date"],
            "coordinates": e.get("coordinates"),
        })
    save_json(os.path.join(dataset_dir, "recentEvents.json"), recent)

    return {
        "events": total,
        "regions": len(regions),
        "trends": len(trends),
        "date_range": f"{date_from} to {date_to}",
        "severity": overall_sev,
    }


# ─── copy to public/data and build manifest ────────────────────────────────

def publish_to_public():
    """Copy all ready datasets from cleanDataset/ to public/data/ and write datasets.json."""
    os.makedirs(PUBLIC_DIR, exist_ok=True)

    datasets = []
    if not os.path.isdir(CLEAN_DIR):
        return datasets

    for name in sorted(os.listdir(CLEAN_DIR)):
        src = os.path.join(CLEAN_DIR, name)
        if not os.path.isdir(src):
            continue
        if not os.path.isfile(os.path.join(src, "analysisSummary.json")):
            continue

        dest = os.path.join(PUBLIC_DIR, name)
        if os.path.exists(dest):
            shutil.rmtree(dest)
        shutil.copytree(src, dest)
        datasets.append({"name": name, "ready": True})
        print(f"  Published: {name}")

    save_json(os.path.join(PUBLIC_DIR, "datasets.json"), {"datasets": datasets})
    return datasets


# ─── main ───────────────────────────────────────────────────────────────────

def main():
    csv_files = []

    if len(sys.argv) > 1:
        # Process specific file(s)
        for arg in sys.argv[1:]:
            path = arg if os.path.isabs(arg) else os.path.join(ROOT, arg)
            if os.path.isfile(path) and path.endswith(".csv"):
                csv_files.append(path)
            else:
                print(f"  Skipping (not a CSV file): {arg}")
    else:
        # Process all CSVs in rawData/
        if os.path.isdir(RAW_DIR):
            for f in sorted(os.listdir(RAW_DIR)):
                if f.endswith(".csv"):
                    csv_files.append(os.path.join(RAW_DIR, f))

    if not csv_files:
        print("No CSV files found to process.")
        sys.exit(1)

    print(f"Found {len(csv_files)} CSV file(s) to process.\n")

    for csv_path in csv_files:
        name = os.path.splitext(os.path.basename(csv_path))[0]
        dataset_dir = os.path.join(CLEAN_DIR, name)
        print(f"{'=' * 60}")
        print(f"Processing: {name}")
        print(f"{'=' * 60}")

        # Step 1: parse CSV → intermediate files
        print("\n[1/3] Parsing CSV...")
        result = subprocess.run(
            [sys.executable, PARSE_SCRIPT, csv_path, CLEAN_DIR],
            capture_output=True, text=True,
        )
        print(result.stdout)
        if result.returncode != 0:
            print(f"  ERROR: {result.stderr}")
            continue

        # Step 2: generate final 5 JSON files
        print("[2/3] Generating dashboard JSON files...")
        stats = generate_all(dataset_dir)
        print(f"  Events: {stats['events']:,} | Regions: {stats['regions']} | "
              f"Trends: {stats['trends']} | Range: {stats['date_range']} | "
              f"Severity: {stats['severity']}")

        print(f"\n  ✓ {name} ready\n")

    # Step 3: publish to public/data/
    print(f"{'=' * 60}")
    print("[3/3] Publishing to public/data/...")
    datasets = publish_to_public()
    print(f"\n✓ Done! {len(datasets)} dataset(s) available in the dashboard dropdown.")


if __name__ == "__main__":
    main()
