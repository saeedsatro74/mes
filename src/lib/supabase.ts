import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://enoktjeitapywdubamjq.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hYX_PYsOpmDGMGcRFFih0Q_bLMkmrg7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DbCustomer {
  id: string;
  name: string;
  mobile: string;
  password?: string;
  wallet_cash: number;
  copper_balance: number;
  share_percentage: number;
  realized_profit: number;
  profit_change_percent: number;
  average_buy_price: number;
  in_transit_checks: number;
  blocked_copper: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbTransaction {
  id: string;
  customer_id: string;
  customer_name: string;
  type: string;
  date: string;
  time?: string;
  amount_kg?: number | null;
  rate_per_kg?: number | null;
  total_amount: number;
  status: string;
  description?: string | null;
  check_number?: string | null;
  after_wallet_cash?: number | null;
  profit_val?: number | null;
  created_at?: string;
}

export interface DbCompanySettings {
  id: number;
  admin_password?: string;
  company_warehouse_copper?: number;
  buy_copper_price?: number;
  sell_copper_price?: number;
  updated_at?: string;
}
