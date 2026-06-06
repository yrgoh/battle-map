#!/usr/bin/env python3
"""
HPB F&B Partners Scraper
Scrapes Healthier Dining Programme partners from HPB API and exports to CSV.
"""

import csv
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: requests package not installed.", file=sys.stderr)
    print("Install it with: pip install requests", file=sys.stderr)
    sys.exit(1)


# Configuration
API_URL = "https://ch-api.healthhub.sg/api/public/content/30fb84bc6ca84a51b84ef2fc78122097"
OUTPUT_DIR = Path(__file__).parent / "data"
OUTPUT_CSV = OUTPUT_DIR / "hpb_fnb_partners.csv"
OUTPUT_JSON = OUTPUT_DIR / "hpb_fnb_partners.json"


def fetch_data(url: str) -> list[dict]:
    """Fetch F&B partner data from HPB API."""
    print(f"Fetching data from HPB API...", file=sys.stderr)
    print(f"  URL: {url}", file=sys.stderr)

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()

        if not isinstance(data, list):
            print(f"Error: Expected JSON array, got {type(data)}", file=sys.stderr)
            sys.exit(1)

        print(f"  Received {len(data)} records", file=sys.stderr)
        return data

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        sys.exit(1)


def transform_for_csv(records: list[dict]) -> list[dict]:
    """Transform API records for CSV output."""
    transformed = []

    for record in records:
        # Flatten menu_item_endorsement array
        endorsements = record.get("menu_item_endorsement", [])
        endorsement_str = "; ".join(filter(None, endorsements)) if endorsements else ""

        transformed.append({
            "id": record.get("id", ""),
            "name_of_outlet": record.get("name_of_outlet", ""),
            "company_name": record.get("company_name", ""),
            "brand_name": record.get("brand_name", ""),
            "dining_concept": record.get("dining_concept", ""),
            "fnb_settings": record.get("fnb_settings", ""),
            "category": record.get("category", ""),
            "location": record.get("location", ""),
            "regions": record.get("regions", ""),
            "edsh_supporting_outlets": record.get("edsh_supporting_outlets", ""),
            "menu_item_endorsements": endorsement_str,
        })

    # Sort by company name, then outlet name
    transformed.sort(key=lambda x: (x["company_name"] or "", x["name_of_outlet"] or ""))

    return transformed


def save_to_csv(records: list[dict], filepath: Path) -> None:
    """Save records to CSV file."""
    if not records:
        print("Warning: No records to save", file=sys.stderr)
        return

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "id",
        "name_of_outlet",
        "company_name",
        "brand_name",
        "dining_concept",
        "fnb_settings",
        "category",
        "location",
        "regions",
        "edsh_supporting_outlets",
        "menu_item_endorsements",
    ]

    print(f"Writing to {filepath}...", file=sys.stderr)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"  Wrote {len(records)} rows", file=sys.stderr)


def save_to_json(records: list[dict], filepath: Path) -> None:
    """Save raw records to JSON for backup."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"  Also saved backup to {filepath}", file=sys.stderr)


def print_summary(records: list[dict]) -> None:
    """Print summary statistics."""
    print("\n=== Summary ===", file=sys.stderr)

    # Count by dining concept
    halal_count = sum(1 for r in records if r.get("dining_concept") == "Halal")
    non_halal_count = sum(1 for r in records if r.get("dining_concept") == "Non-Halal")

    print(f"Total partners: {len(records)}", file=sys.stderr)
    print(f"  Halal: {halal_count}", file=sys.stderr)
    print(f"  Non-Halal: {non_halal_count}", file=sys.stderr)

    # Count by region
    regions = {}
    for r in records:
        region = r.get("regions", "Unknown")
        regions[region] = regions.get(region, 0) + 1

    print(f"\nBy region:", file=sys.stderr)
    for region, count in sorted(regions.items()):
        print(f"  {region}: {count}", file=sys.stderr)

    # Count by F&B setting
    settings = {}
    for r in records:
        setting = r.get("fnb_settings", "Unknown")
        settings[setting] = settings.get(setting, 0) + 1

    print(f"\nBy F&B setting:", file=sys.stderr)
    for setting, count in sorted(settings.items(), key=lambda x: -x[1]):
        print(f"  {setting}: {count}", file=sys.stderr)


def main():
    """Main entry point."""
    print("=" * 50, file=sys.stderr)
    print("HPB F&B Partners Scraper", file=sys.stderr)
    print(f"Run at: {datetime.now().isoformat()}", file=sys.stderr)
    print("=" * 50, file=sys.stderr)

    # Fetch data
    raw_data = fetch_data(API_URL)

    # Transform for CSV
    csv_data = transform_for_csv(raw_data)

    # Save outputs
    save_to_csv(csv_data, OUTPUT_CSV)
    save_to_json(raw_data, OUTPUT_JSON)

    # Print summary
    print_summary(csv_data)

    print("\nDone! Output saved to:", file=sys.stderr)
    print(f"  CSV: {OUTPUT_CSV}", file=sys.stderr)
    print(f"  JSON: {OUTPUT_JSON}", file=sys.stderr)


if __name__ == "__main__":
    main()