-- Migration: Add extra fields to portfolio_items
-- Required for the frontend UI

-- Add missing columns to portfolio_items if they don't exist
DO $$ 
BEGIN
    -- tcgdex_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portfolio_items' AND column_name = 'tcgdex_id') THEN
        ALTER TABLE portfolio_items ADD COLUMN tcgdex_id VARCHAR(100);
    END IF;

    -- name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portfolio_items' AND column_name = 'name') THEN
        ALTER TABLE portfolio_items ADD COLUMN name VARCHAR(255);
    END IF;

    -- set_name column  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portfolio_items' AND column_name = 'set_name') THEN
        ALTER TABLE portfolio_items ADD COLUMN set_name VARCHAR(255);
    END IF;

    -- image_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portfolio_items' AND column_name = 'image_url') THEN
        ALTER TABLE portfolio_items ADD COLUMN image_url TEXT;
    END IF;

    -- current_price column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portfolio_items' AND column_name = 'current_price') THEN
        ALTER TABLE portfolio_items ADD COLUMN current_price DECIMAL(12, 2) DEFAULT 0;
    END IF;

    -- score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'portfolio_items' AND column_name = 'score') THEN
        ALTER TABLE portfolio_items ADD COLUMN score INTEGER DEFAULT 50;
    END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_items_tcgdex ON portfolio_items(tcgdex_id);
