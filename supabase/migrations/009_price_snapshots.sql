-- Migration: Add price snapshots table for historical tracking
-- This table stores daily price snapshots from the sync job

-- Table for daily price snapshots
CREATE TABLE IF NOT EXISTS price_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id TEXT NOT NULL,                    -- Pokemon TCG API card ID
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Cardmarket prices (EUR)
    trend_price DECIMAL(10,2),
    avg_sell_price DECIMAL(10,2),
    low_price DECIMAL(10,2),
    
    -- TCGPlayer prices (USD)
    tcgplayer_price DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One snapshot per card per day
    UNIQUE(card_id, date)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_price_snapshots_card ON price_snapshots(card_id);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_date ON price_snapshots(date DESC);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_lookup ON price_snapshots(card_id, date DESC);

-- RLS policies
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read price_snapshots" ON price_snapshots
    FOR SELECT TO public USING (true);

CREATE POLICY "Service write price_snapshots" ON price_snapshots
    FOR ALL TO service_role USING (true);

-- Function to automatically insert a price snapshot when price_cache is updated
CREATE OR REPLACE FUNCTION log_price_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if we don't have a snapshot for today already
    INSERT INTO price_snapshots (card_id, date, trend_price, avg_sell_price, low_price, tcgplayer_price)
    VALUES (NEW.id, CURRENT_DATE, NEW.trend_price, NEW.avg_sell_price, NEW.low_price, NEW.tcgplayer_price)
    ON CONFLICT (card_id, date) 
    DO UPDATE SET
        trend_price = EXCLUDED.trend_price,
        avg_sell_price = EXCLUDED.avg_sell_price,
        low_price = EXCLUDED.low_price,
        tcgplayer_price = EXCLUDED.tcgplayer_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on card_prices table (if it exists)
DROP TRIGGER IF EXISTS trigger_price_snapshot ON card_prices;
CREATE TRIGGER trigger_price_snapshot
    AFTER INSERT OR UPDATE ON card_prices
    FOR EACH ROW
    EXECUTE FUNCTION log_price_snapshot();
