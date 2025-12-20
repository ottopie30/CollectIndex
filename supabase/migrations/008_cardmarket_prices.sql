-- Migration: Create cardmarket_mapping table and price_history table
-- For storing Cardmarket price history from daily PriceGuide JSON

-- Table to map TCGdex card IDs to Cardmarket product IDs
CREATE TABLE IF NOT EXISTS cardmarket_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tcgdex_id TEXT NOT NULL UNIQUE,          -- TCGdex ID (e.g., "sv4pt5-144")
    cardmarket_id INTEGER NOT NULL,           -- Cardmarket idProduct
    card_name TEXT,
    set_name TEXT,
    set_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cm_mapping_tcgdex ON cardmarket_mapping(tcgdex_id);
CREATE INDEX IF NOT EXISTS idx_cm_mapping_cardmarket ON cardmarket_mapping(cardmarket_id);

-- Table to store historical price data from Cardmarket
-- One entry per card per day
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cardmarket_id INTEGER NOT NULL,           -- Cardmarket idProduct
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Regular prices (€)
    avg DECIMAL(10,2),                        -- Average sell price
    low DECIMAL(10,2),                        -- Lowest price
    trend DECIMAL(10,2),                      -- Trend price
    avg1 DECIMAL(10,2),                       -- 1-day average
    avg7 DECIMAL(10,2),                       -- 7-day average
    avg30 DECIMAL(10,2),                      -- 30-day average
    
    -- Holo/foil prices (€)
    avg_holo DECIMAL(10,2),
    low_holo DECIMAL(10,2),
    trend_holo DECIMAL(10,2),
    avg7_holo DECIMAL(10,2),
    avg30_holo DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One entry per card per day
    UNIQUE(cardmarket_id, date)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_price_history_cardmarket ON price_history(cardmarket_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_lookup ON price_history(cardmarket_id, date DESC);

-- View to get latest price for each card
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (cardmarket_id)
    cardmarket_id,
    date,
    avg,
    low,
    trend,
    avg7,
    avg30,
    trend_holo
FROM price_history
ORDER BY cardmarket_id, date DESC;

-- RLS policies (if needed)
ALTER TABLE cardmarket_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access to cardmarket_mapping" ON cardmarket_mapping
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to price_history" ON price_history
    FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access cardmarket_mapping" ON cardmarket_mapping
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access price_history" ON price_history
    FOR ALL USING (auth.role() = 'service_role');
