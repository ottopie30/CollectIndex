# 💶 Cardmarket Integration Guide

This project integrates full Cardmarket price tracking using a hybrid robust approach.

## 🚀 Architecture

1.  **Mappings (`cardmarket_mapping`)**: Links TCGdex IDs (e.g., `sv3pt5-1`) to Cardmarket Product IDs (e.g., `12345`).
2.  **Price Sync (Daily)**: Fetches the *entire* Cardmarket Price Guide (one 13MB JSON file) and updates all mapped cards instantly.
3.  **History (`price_snapshots`)**: Tracks daily price changes for charts and trend analysis.

## 🛠️ Setup Instructions

### 1. Database Migration
Run the migration in your Supabase SQL Editor to create the necessary tables:
`supabase/migrations/009_price_snapshots.sql`

### 2. Initialize Mappings (The "Bridge")
We need to tell the system which Cardmarket ID corresponds to which card.
Use the Sync API to map sets reliably using the official Pokemon TCG API data.

**Example: Map the "151" set (sv3pt5)**
```bash
# Visit this URL in your browser or use curl
GET /api/cardmarket/sync-mappings?set=sv3pt5
```

**Recommended Sets to Map:**
- `sv3pt5` (Pokemon 151)
- `sv4` (Paradox Rift)
- `sv4pt5` (Paldean Fates)
- `sv5` (Temporal Forces)
- `sv6` (Twilight Masquerade)

### 3. Run Price Sync
Once mappings are created, the daily sync will pick them up automatically.
```bash
GET /api/cron/sync-cardmarket
```
*Note: This runs automatically every day at 3 AM UTC via Vercel Cron.*

## 📊 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/cardmarket/sync-mappings?set=X` | Creates mappings for a set using Official API (Best) |
| `/api/cardmarket/auto-map?expansion=X` | Creates mappings using Cardmarket Catalog (Alternative) |
| `/api/cron/sync-cardmarket` | Updates prices for ALL mapped cards (Daily Job) |
| `/api/prices/chart?cardId=X` | Returns price history for charts |

## 💡 Why this approach?
- **Zero Rate Limits**: The daily sync uses 1 static file download instead of 5000 API calls.
- **Accurate**: Mappings are based on official data, not fuzzy name matching.
- **Fast**: Prices are served from your Supabase DB, not fetched on-the-fly.
