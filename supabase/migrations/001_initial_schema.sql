-- Altum Analytics Database Schema
-- Version: 1.0
-- Date: December 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CARDS TABLE
-- Stores Pokemon card information from TCGdex
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tcgdex_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  set_name VARCHAR(255),
  set_id VARCHAR(50),
  rarity VARCHAR(50),
  category VARCHAR(50),
  illustrator VARCHAR(255),
  hp INTEGER,
  types TEXT[], -- Array of types (Fire, Water, etc)
  grade VARCHAR(20), -- PSA/BGS grade if graded
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- PRICE HISTORY TABLE
-- Stores historical price data from various sources
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  source VARCHAR(50) NOT NULL, -- 'ebay', 'tcgplayer', 'cardmarket'
  listing_type VARCHAR(20) NOT NULL, -- 'sold', 'active'
  listing_url TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- SPECULATION SCORES TABLE
-- Stores calculated speculation scores for cards
-- ============================================
CREATE TABLE IF NOT EXISTS speculation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  score_total INTEGER CHECK (score_total >= 0 AND score_total <= 100),
  
  -- Dimension 1: Volatility (25%)
  d1_volatility INTEGER,
  d1_cv DECIMAL(10, 4), -- Coefficient of Variation
  d1_ptr DECIMAL(10, 4), -- Peak-to-Trough Ratio
  d1_acceleration DECIMAL(10, 4),
  
  -- Dimension 2: Inorganic Growth (25%)
  d2_growth INTEGER,
  d2_excess_return DECIMAL(10, 4),
  d2_pump_dump_ratio DECIMAL(10, 4),
  d2_crypto_correlation DECIMAL(10, 4),
  
  -- Dimension 3: Scarcity (20%)
  d3_scarcity INTEGER,
  d3_rarity_ratio DECIMAL(10, 4),
  d3_supply_demand DECIMAL(10, 4),
  
  -- Dimension 4: Sentiment (15%)
  d4_sentiment INTEGER,
  d4_social_score DECIMAL(10, 4),
  d4_buyer_seller_ratio DECIMAL(10, 4),
  d4_hype_index DECIMAL(10, 4),
  
  -- Dimension 5: Macro (15%)
  d5_macro INTEGER,
  d5_btc_correlation DECIMAL(10, 4),
  d5_fear_greed INTEGER,
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- FAIR VALUE TABLE
-- Stores calculated fair values for cards
-- ============================================
CREATE TABLE IF NOT EXISTS fair_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  
  -- DCF Model
  dcf_value DECIMAL(12, 2),
  
  -- Comparable Analysis
  comps_value DECIMAL(12, 2),
  
  -- Historical Bands
  historical_low DECIMAL(12, 2),
  historical_mean DECIMAL(12, 2),
  historical_high DECIMAL(12, 2),
  
  -- Supply Adjusted
  supply_adjusted_value DECIMAL(12, 2),
  
  -- Ensemble (weighted average)
  ensemble_value DECIMAL(12, 2),
  confidence_interval_low DECIMAL(12, 2),
  confidence_interval_high DECIMAL(12, 2),
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- PORTFOLIOS TABLE
-- User portfolios for tracking card collections
-- ============================================
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- PORTFOLIO ITEMS TABLE
-- Individual cards within a portfolio
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  purchase_price DECIMAL(12, 2),
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- ALERTS TABLE
-- User-configured price and score alerts
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'price_above', 'price_below', 'score_change', 'correction', 'rebound'
  threshold_value DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- MARKET METRICS TABLE
-- Daily market-wide metrics
-- ============================================
CREATE TABLE IF NOT EXISTS market_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  vintage_index DECIMAL(10, 4),
  modern_index DECIMAL(10, 4),
  speculation_sentiment INTEGER,
  correction_probability DECIMAL(5, 2),
  btc_correlation DECIMAL(5, 4),
  fear_greed_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cards_tcgdex ON cards(tcgdex_id);
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_id);

CREATE INDEX IF NOT EXISTS idx_prices_card ON price_history(card_id);
CREATE INDEX IF NOT EXISTS idx_prices_date ON price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_prices_source ON price_history(source);

CREATE INDEX IF NOT EXISTS idx_scores_card ON speculation_scores(card_id);
CREATE INDEX IF NOT EXISTS idx_scores_date ON speculation_scores(calculated_at);

CREATE INDEX IF NOT EXISTS idx_fair_values_card ON fair_values(card_id);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio ON portfolio_items(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_card ON portfolio_items(card_id);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_card ON alerts(card_id);

CREATE INDEX IF NOT EXISTS idx_market_metrics_date ON market_metrics(date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policies for portfolios
CREATE POLICY "Users can view their own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for portfolio items
CREATE POLICY "Users can view items in their portfolios"
  ON portfolio_items FOR SELECT
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can add items to their portfolios"
  ON portfolio_items FOR INSERT
  WITH CHECK (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can update items in their portfolios"
  ON portfolio_items FOR UPDATE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete items from their portfolios"
  ON portfolio_items FOR DELETE
  USING (portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()));

-- Policies for alerts
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Public read access for cards, prices, scores, fair values
CREATE POLICY "Anyone can view cards"
  ON cards FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view speculation scores"
  ON speculation_scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view fair values"
  ON fair_values FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view market metrics"
  ON market_metrics FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = TIMEZONE('utc', NOW());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
