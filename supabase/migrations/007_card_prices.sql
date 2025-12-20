-- Daily Price Cache Table
-- Stores the 20,000 most expensive cards' prices for instant retrieval

CREATE TABLE IF NOT EXISTS card_prices (
    id TEXT PRIMARY KEY,              -- Pokemon TCG API ID (e.g., "sv01-123")
    name TEXT NOT NULL,
    set_id TEXT,
    set_name TEXT,
    number TEXT,
    rarity TEXT,
    trend_price DECIMAL(10, 2),       -- Cardmarket trend price (EUR)
    avg_sell_price DECIMAL(10, 2),    -- Cardmarket average sell price
    low_price DECIMAL(10, 2),         -- Cardmarket low price
    tcgplayer_price DECIMAL(10, 2),   -- TCGPlayer market price (USD)
    image_small TEXT,
    image_large TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by price (most expensive first)
CREATE INDEX IF NOT EXISTS idx_card_prices_trend ON card_prices (trend_price DESC NULLS LAST);

-- Index for set-based queries
CREATE INDEX IF NOT EXISTS idx_card_prices_set ON card_prices (set_id);

-- Function to auto-update timestamp
CREATE OR REPLACE FUNCTION update_card_prices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS trigger_card_prices_updated ON card_prices;
CREATE TRIGGER trigger_card_prices_updated
    BEFORE UPDATE ON card_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_card_prices_timestamp();

-- Enable RLS
ALTER TABLE card_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read access (prices are public data)
CREATE POLICY "Allow public read access" ON card_prices
    FOR SELECT USING (true);

-- Allow all inserts/updates (cache table, no sensitive data)
-- The cron endpoint is protected by CRON_SECRET, not RLS
CREATE POLICY "Allow all writes" ON card_prices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all updates" ON card_prices
    FOR UPDATE USING (true) WITH CHECK (true);
