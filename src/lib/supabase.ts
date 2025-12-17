import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lazy initialization to allow build without env vars
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

// For backward compatibility - will throw if used during build
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop)
  }
})

// Types for database
export type Card = {
  id: string
  tcgdex_id: string
  name: string
  set_name: string
  set_id: string
  rarity: string
  grade?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export type PriceHistory = {
  id: string
  card_id: string
  price: number
  source: 'ebay' | 'tcgplayer' | 'cardmarket'
  listing_type: 'sold' | 'active'
  recorded_at: string
}

export type SpeculationScore = {
  id: string
  card_id: string
  score_total: number
  d1_volatility: number
  d2_growth: number
  d3_scarcity: number
  d4_sentiment: number
  d5_macro: number
  calculated_at: string
}

export type Portfolio = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type PortfolioItem = {
  id: string
  portfolio_id: string
  card_id: string
  quantity: number
  purchase_price: number
  purchase_date: string
  created_at: string
}
