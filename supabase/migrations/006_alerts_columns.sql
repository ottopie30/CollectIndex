-- Migration: Add extra fields to alerts table
-- Required for the frontend UI

-- Add missing columns to alerts if they don't exist
DO $$ 
BEGIN
    -- tcgdex_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'tcgdex_id') THEN
        ALTER TABLE alerts ADD COLUMN tcgdex_id VARCHAR(100);
    END IF;

    -- card_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'card_name') THEN
        ALTER TABLE alerts ADD COLUMN card_name VARCHAR(255);
    END IF;

    -- card_image column  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'card_image') THEN
        ALTER TABLE alerts ADD COLUMN card_image TEXT;
    END IF;

    -- current_value column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'current_value') THEN
        ALTER TABLE alerts ADD COLUMN current_value DECIMAL(12, 2) DEFAULT 0;
    END IF;

    -- triggered column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'triggered') THEN
        ALTER TABLE alerts ADD COLUMN triggered BOOLEAN DEFAULT FALSE;
    END IF;

    -- triggered_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'triggered_at') THEN
        ALTER TABLE alerts ADD COLUMN triggered_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_alerts_tcgdex ON alerts(tcgdex_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);
