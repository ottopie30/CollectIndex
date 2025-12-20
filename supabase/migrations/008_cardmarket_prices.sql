-- Migration: Create cardmarket_mapping table and price_history table
-- For storing Cardmarket price history from daily PriceGuide JSON
-- NOTE: Run this in Supabase SQL Editor

-- Drop existing tables if they exist (for clean install)
DROP VIEW IF EXISTS latest_prices;
DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS cardmarket_mapping;

-- Table to map TCGdex card IDs to Cardmarket product IDs
CREATE TABLE cardmarket_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tcgdex_id TEXT NOT NULL UNIQUE,
    cardmarket_id INTEGER NOT NULL,
    card_name TEXT,
    set_name TEXT,
    set_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store historical price data from Cardmarket
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cardmarket_id INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Regular prices (EUR)
    avg DECIMAL(10,2),
    low DECIMAL(10,2),
    trend DECIMAL(10,2),
    avg1 DECIMAL(10,2),
    avg7 DECIMAL(10,2),
    avg30 DECIMAL(10,2),
    
    -- Holo/foil prices (EUR)
    avg_holo DECIMAL(10,2),
    low_holo DECIMAL(10,2),
    trend_holo DECIMAL(10,2),
    avg7_holo DECIMAL(10,2),
    avg30_holo DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint after table creation
ALTER TABLE price_history ADD CONSTRAINT price_history_unique UNIQUE (cardmarket_id, date);

-- Create indexes
CREATE INDEX idx_cm_mapping_tcgdex ON cardmarket_mapping(tcgdex_id);
CREATE INDEX idx_cm_mapping_cardmarket ON cardmarket_mapping(cardmarket_id);
CREATE INDEX idx_price_history_cardmarket ON price_history(cardmarket_id);
CREATE INDEX idx_price_history_date ON price_history(date DESC);
CREATE INDEX idx_price_history_lookup ON price_history(cardmarket_id, date DESC);

-- View to get latest price for each card
CREATE VIEW latest_prices AS
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

-- RLS policies
ALTER TABLE cardmarket_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read cardmarket_mapping" ON cardmarket_mapping
    FOR SELECT TO public USING (true);

CREATE POLICY "Public read price_history" ON price_history
    FOR SELECT TO public USING (true);

-- Allow service role to insert/update
CREATE POLICY "Service write cardmarket_mapping" ON cardmarket_mapping
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service write price_history" ON price_history
    FOR ALL TO service_role USING (true);
