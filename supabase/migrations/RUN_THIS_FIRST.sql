-- COMPLETE MIGRATION FOR ALTUM ANALYTICS
-- Run this in Supabase SQL Editor to set up all required tables and columns

-- ============================================
-- PORTFOLIO ITEMS - Extra columns
-- ============================================
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS tcgdex_id VARCHAR(100);
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS set_name VARCHAR(255);
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS current_price DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 50;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_tcgdex ON portfolio_items(tcgdex_id);

-- ============================================
-- ALERTS - Extra columns
-- ============================================
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS tcgdex_id VARCHAR(100);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS card_name VARCHAR(255);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS card_image TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS current_value DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS triggered BOOLEAN DEFAULT FALSE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_alerts_tcgdex ON alerts(tcgdex_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);

-- ============================================
-- GRANT RLS ACCESS
-- ============================================
-- Make sure RLS is enabled
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policies should already exist from initial migration
-- If not, run the 001_initial_schema.sql first

SELECT 'Migration complete! All tables and columns are ready.' as status;
