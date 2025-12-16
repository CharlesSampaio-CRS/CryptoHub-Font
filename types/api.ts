export interface Token {
  amount: string;
  price_usd: string;
  value_usd: string;
}

export interface Exchange {
  exchange_id: string;
  name: string;
  success: boolean;
  tokens: Record<string, Token>;
  total_usd: string;
}

export interface BalanceResponse {
  exchanges: Exchange[];
  meta: {
    from_cache: boolean;
    fetch_time?: string;
  };
  summary: {
    exchanges_count: number;
    total_usd: string;
  };
  timestamp: string;
  user_id: string;
}

export interface AvailableExchange {
  _id: string;
  ccxt_id: string;
  icon: string;
  nome: string;
  pais_de_origem: string;
  requires_passphrase: boolean;
  url: string;
}

export interface AvailableExchangesResponse {
  exchanges: AvailableExchange[];
  success: boolean;
  total: number;
}

export interface LinkedExchange {
  _id?: string;
  user_id?: string;
  exchange_id: string;
  ccxt_id: string;
  name: string;
  icon: string;
  country: string;
  url: string;
  status: 'active' | 'inactive';
  is_active?: boolean;
  linked_at: string;
  updated_at: string;
  disconnected_at?: string;
  reconnected_at?: string;
  api_key?: string;
  api_secret?: string;
  passphrase?: string;
}

export interface LinkedExchangesResponse {
  exchanges: LinkedExchange[];
  success: boolean;
  total: number;
}

export interface PortfolioEvolutionSummary {
  period_days: number;
  data_points: number;
  start_value_usd: string;
  end_value_usd: string;
  min_value_usd: string;
  max_value_usd: string;
  change_usd: string;
  change_percent: string;
}

export interface PortfolioEvolution {
  timestamps: string[];
  values_usd: number[];
  values_brl: number[];
  summary: PortfolioEvolutionSummary;
}

export interface PortfolioEvolutionResponse {
  user_id: string;
  days: number;
  success: boolean;
  evolution: PortfolioEvolution;
}
