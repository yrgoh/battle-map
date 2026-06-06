# HPB F&B Partners Scraper

Scrapes Healthier Dining Programme partners from HPB API and exports to CSV.

## Setup

```bash
cd scripts
pip install -r requirements.txt
```

## Usage

```bash
python scrape_hpb_fnb.py
```

## Output

- `data/hpb_fnb_partners.csv` - Main CSV output
- `data/hpb_fnb_partners.json` - Raw JSON backup

## CSV Columns

| Column | Description |
|--------|-------------|
| id | Partner ID |
| name_of_outlet | Outlet name |
| company_name | Parent company |
| brand_name | Brand name |
| dining_concept | Halal / Non-Halal |
| fnb_settings | Restaurant type |
| category | Cuisine type |
| location | Full address |
| regions | Geographic region |
| edsh_supporting_outlets | EDSH support |
| menu_item_endorsements | Healthier options |

## Requirements

- Python 3.x
- requests>=2.31.0