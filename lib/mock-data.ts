/**
 * Mock data para testes locais - DADOS REAIS DA API
 * Configure config.useMockData = true para usar estes dados
 * Fonte: frontend_*.json gerado em 2025-12-19
 */

import { 
  LinkedExchange, 
  BalanceResponse, 
  Token,
  AvailableExchange,
  AvailableExchangesResponse,
  LinkedExchangesResponse,
  PortfolioEvolutionResponse,
} from "@/types/api"
import { Strategy } from "@/services/strategies"

// Mock de exchanges disponíveis no formato da API /exchanges/available
export const mockAvailableExchangesForApi: AvailableExchange[] = [
  {
    _id: "693481148b0a41e8b6acb073",
    ccxt_id: "binance",
    nome: "Binance",
    icon: "https://img.icons8.com/color/96/binance.png",
    pais_de_origem: "Desconhecido / Internacional",
    url: "https://binance.com",
    requires_passphrase: false,
  },
  {
    _id: "693481148b0a41e8b6acb078",
    ccxt_id: "bybit",
    nome: "Bybit",
    icon: "https://img.icons8.com/color/96/bybit.png",
    pais_de_origem: "Dubai",
    url: "https://www.bybit.com",
    requires_passphrase: false,
  },
  {
    _id: "693481148b0a41e8b6acb077",
    ccxt_id: "okx",
    nome: "OKX",
    icon: "https://img.icons8.com/color/96/okx.png",
    pais_de_origem: "Seychelles",
    url: "https://www.okx.com",
    requires_passphrase: true,
  },
  {
    _id: "693481148b0a41e8b6acb07b",
    ccxt_id: "mexc",
    nome: "MEXC",
    icon: "https://img.icons8.com/color/96/mexc.png",
    pais_de_origem: "Seychelles",
    url: "https://mexc.com",
    requires_passphrase: false,
  },
  {
    _id: "693481148b0a41e8b6acb079",
    ccxt_id: "novadax",
    nome: "NovaDAX",
    icon: "https://img.icons8.com/color/96/novadax.png",
    pais_de_origem: "Brasil",
    url: "https://www.novadax.com.br",
    requires_passphrase: false,
  },
  {
    _id: "693481148b0a41e8b6acb075",
    ccxt_id: "kraken",
    nome: "Kraken",
    icon: "https://img.icons8.com/color/96/kraken.png",
    pais_de_origem: "Estados Unidos",
    url: "https://www.kraken.com",
    requires_passphrase: false,
  },
  {
    _id: "693481148b0a41e8b6acb07a",
    ccxt_id: "gateio",
    nome: "Gate.io",
    icon: "https://img.icons8.com/color/96/gateio.png",
    pais_de_origem: "Cayman Islands",
    url: "https://www.gate.io",
    requires_passphrase: false,
  },
  {
    _id: "693481148b0a41e8b6acb076",
    ccxt_id: "kucoin",
    nome: "KuCoin",
    icon: "https://img.icons8.com/color/96/kucoin.png",
    pais_de_origem: "Seychelles",
    url: "https://www.kucoin.com",
    requires_passphrase: true,
  },
  {
    _id: "6942d26ffa8ecd38fb975eff",
    ccxt_id: "bitget",
    nome: "Bitget",
    icon: "https://img.icons8.com/color/96/bitget.png",
    pais_de_origem: "Singapura",
    url: "https://www.bitget.com",
    requires_passphrase: false,
  },
  {
    _id: "6942d27ffa8ecd38fb975f01",
    ccxt_id: "coinex",
    nome: "CoinEx",
    icon: "https://img.icons8.com/color/96/coinex.png",
    pais_de_origem: "Hong Kong",
    url: "https://www.coinex.com",
    requires_passphrase: false,
  },
  {
    _id: "693481148b0a41e8b6acb074",
    ccxt_id: "coinbase",
    nome: "Coinbase",
    icon: "https://img.icons8.com/color/96/coinbase.png",
    pais_de_origem: "Estados Unidos",
    url: "https://coinbase.com",
    requires_passphrase: false,
  },
]

// Mock de exchanges já conectadas/linkadas (formato LinkedExchange)
export const mockAvailableExchanges: LinkedExchange[] = [
  {
    _id: "693481148b0a41e8b6acb073",
    exchange_id: "693481148b0a41e8b6acb073",
    ccxt_id: "binance",
    name: "Binance",
    icon: "https://img.icons8.com/color/96/binance.png",
    country: "Desconhecido / Internacional",
    url: "https://binance.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb074",
    exchange_id: "693481148b0a41e8b6acb074",
    ccxt_id: "coinbase",
    name: "Coinbase",
    icon: "https://img.icons8.com/color/96/coinbase.png",
    country: "Estados Unidos",
    url: "https://coinbase.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb075",
    exchange_id: "693481148b0a41e8b6acb075",
    ccxt_id: "kraken",
    name: "Kraken",
    icon: "https://img.icons8.com/color/96/kraken.png",
    country: "Estados Unidos",
    url: "https://kraken.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb076",
    exchange_id: "693481148b0a41e8b6acb076",
    ccxt_id: "kucoin",
    name: "KuCoin",
    icon: "https://img.icons8.com/color/96/kucoin.png",
    country: "Seychelles",
    url: "https://kucoin.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb077",
    exchange_id: "693481148b0a41e8b6acb077",
    ccxt_id: "okx",
    name: "OKX",
    icon: "https://img.icons8.com/ios-filled/100/okx.png",
    country: "Estados Unidos",
    url: "https://okx.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb078",
    exchange_id: "693481148b0a41e8b6acb078",
    ccxt_id: "bybit",
    name: "Bybit",
    icon: "https://img.icons8.com/color/96/bybit.png",
    country: "Emirados Árabes Unidos",
    url: "https://bybit.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb079",
    exchange_id: "693481148b0a41e8b6acb079",
    ccxt_id: "novadax",
    name: "NovaDAX",
    icon: "https://play-lh.googleusercontent.com/SpGD7EOKiJZx4GL0010wjQ8T_LbLINpFzdM84ydbUWCD0jUIh0MegGm-4hJtXHEF9lQ=w240-h480-rw",
    country: "Brasil",
    url: "https://novadax.com.br",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb07a",
    exchange_id: "693481148b0a41e8b6acb07a",
    ccxt_id: "gateio",
    name: "Gate.io",
    icon: "https://img.icons8.com/color/96/gate-io.png",
    country: "China / Internacional",
    url: "https://gate.io",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "693481148b0a41e8b6acb07b",
    exchange_id: "693481148b0a41e8b6acb07b",
    ccxt_id: "mexc",
    name: "MEXC",
    icon: "https://img.icons8.com/color/96/mexc.png",
    country: "Seychelles",
    url: "https://mexc.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "6942d26ffa8ecd38fb975eff",
    exchange_id: "6942d26ffa8ecd38fb975eff",
    ccxt_id: "bitget",
    name: "Bitget",
    icon: "https://img.icons8.com/color/96/bitget.png",
    country: "Singapura",
    url: "https://www.bitget.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
  {
    _id: "6942d27ffa8ecd38fb975f01",
    exchange_id: "6942d27ffa8ecd38fb975f01",
    ccxt_id: "coinex",
    name: "CoinEx",
    icon: "https://img.icons8.com/color/96/coinex.png",
    country: "Hong Kong",
    url: "https://www.coinex.com",
    status: "active",
    is_active: true,
    linked_at: "2025-12-06T19:16:35.599000",
    updated_at: "2025-12-06T19:16:35.599000",
  },
]

// Mock de exchanges conectadas pelo usuário
export const mockExchanges = mockAvailableExchanges

// Mock de balances (do frontend_balance_history.json - dados mais recentes)
// ✅ Estrutura compatível com BalanceResponse interface
export const mockBalances: BalanceResponse = {
  user_id: "charles_test_user",
  timestamp: "2025-12-18T03:00:13.918000",
  meta: {
    from_cache: true,
    fetch_time: "0.001",
  },
  summary: {
    exchanges_count: 9, // Total de exchanges conectadas
    total_usd: "181.16",
  },
  exchanges: [
    {
      exchange_id: "693481148b0a41e8b6acb07b",
      name: "MEXC",
      total_usd: "156.49",
      success: true,
      token_count: 1,
      tokens: {
        USDT: {
          amount: "156.49",
          price_usd: "1.00",
          value_usd: "156.49",
          change_24h: "0.01",
        },
      },
    },
    {
      exchange_id: "693481148b0a41e8b6acb078",
      name: "Bybit",
      total_usd: "9.95",
      success: true,
      token_count: 1,
      tokens: {
        USDT: {
          amount: "9.95",
          price_usd: "1.00",
          value_usd: "9.95",
          change_24h: "0.01",
        },
      },
    },
    {
      exchange_id: "693481148b0a41e8b6acb077",
      name: "OKX",
      total_usd: "8.91",
      success: true,
      token_count: 1,
      tokens: {
        USDT: {
          amount: "8.91",
          price_usd: "1.00",
          value_usd: "8.91",
          change_24h: "0.01",
        },
      },
    },
    {
      exchange_id: "693481148b0a41e8b6acb079",
      name: "NovaDAX",
      total_usd: "5.81",
      success: true,
      token_count: 1,
      tokens: {
        BRL: {
          amount: "32.06",
          price_usd: "0.181",
          value_usd: "5.81",
          change_24h: "0.00",
        },
      },
    },
    {
      exchange_id: "693481148b0a41e8b6acb075",
      name: "Kraken",
      total_usd: "0.00",
      success: true,
      token_count: 0,
      tokens: {},
    },
    {
      exchange_id: "6942d27ffa8ecd38fb975f01",
      name: "CoinEx",
      total_usd: "0.00",
      success: true,
      token_count: 0,
      tokens: {},
    },
    {
      exchange_id: "6942d26ffa8ecd38fb975eff",
      name: "Bitget",
      total_usd: "0.00",
      success: true,
      token_count: 0,
      tokens: {},
    },
    {
      exchange_id: "693481148b0a41e8b6acb073",
      name: "Binance",
      total_usd: "0.00",
      success: true,
      token_count: 0,
      tokens: {},
    },
    {
      exchange_id: "693481148b0a41e8b6acb07a",
      name: "Gate.io",
      total_usd: "0.00",
      success: true,
      token_count: 0,
      tokens: {},
    },
  ],
}

// Histórico de balances (do frontend_balance_history.json)
export const mockBalanceHistory = [
  {
    id: "69436e3d2f70cbbabbba12c1",
    user_id: "charles_test_user",
    timestamp: "2025-12-18T03:00:13.918000",
    total_usd: 181.16,
    total_brl: 999.77,
  },
  {
    id: "6941fa9bc9f04a24b113d2bc",
    user_id: "charles_test_user",
    timestamp: "2025-12-17T00:00:00",
    total_usd: 139.19,
    total_brl: 695.95,
  },
  {
    id: "6941fa9bc9f04a24b113d2bd",
    user_id: "charles_test_user",
    timestamp: "2025-12-16T00:00:00",
    total_usd: 108.68,
    total_brl: 543.4,
  },
  {
    id: "6941fa9bc9f04a24b113d2be",
    user_id: "charles_test_user",
    timestamp: "2025-12-15T00:00:00",
    total_usd: 84.3,
    total_brl: 421.5,
  },
  {
    id: "6941fa9bc9f04a24b113d2bf",
    user_id: "charles_test_user",
    timestamp: "2025-12-14T00:00:00",
    total_usd: 135.55,
    total_brl: 677.75,
  },
  {
    id: "6941fa9bc9f04a24b113d2c0",
    user_id: "charles_test_user",
    timestamp: "2025-12-13T00:00:00",
    total_usd: 119.15,
    total_brl: 595.75,
  },
  {
    id: "6941fa9bc9f04a24b113d2c1",
    user_id: "charles_test_user",
    timestamp: "2025-12-12T00:00:00",
    total_usd: 133.9,
    total_brl: 669.5,
  },
  {
    id: "6941fa9cc9f04a24b113d2c2",
    user_id: "charles_test_user",
    timestamp: "2025-12-11T00:00:00",
    total_usd: 103.26,
    total_brl: 516.3,
  },
]

// Mock de tokens disponíveis (principais tokens das exchanges)
export const mockAvailableTokens = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "BNB", name: "Binance Coin" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "BCH", name: "Bitcoin Cash" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "ALGO", name: "Algorand" },
  { symbol: "VET", name: "VeChain" },
  { symbol: "ICP", name: "Internet Computer" },
  { symbol: "FIL", name: "Filecoin" },
  { symbol: "TRX", name: "TRON" },
  { symbol: "ETC", name: "Ethereum Classic" },
  { symbol: "APT", name: "Aptos" },
  { symbol: "ARB", name: "Arbitrum" },
  { symbol: "OP", name: "Optimism" },
  { symbol: "NEAR", name: "NEAR Protocol" },
  { symbol: "HBAR", name: "Hedera" },
  { symbol: "SAND", name: "The Sandbox" },
]

// Mock de estratégias (vazio por padrão - dados reais estão vazios)
export const mockStrategies: Strategy[] = []

// Mock de detalhes de token (exemplos com preços atuais aproximados)
export const mockTokenDetails = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    balance: 0.0,
    available: 0.0,
    locked: 0,
    usd_value: 0.0,
    price_usd: 104500.00,
    change_24h: 2.15,
    change_7d: 5.42,
    change_30d: 12.34,
    high_24h: 106200.00,
    low_24h: 102800.00,
    volume_24h: 35600000000,
    market_cap: 2060000000000,
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    balance: 0.0,
    available: 0.0,
    locked: 0,
    usd_value: 0.0,
    price_usd: 3950.00,
    change_24h: 1.85,
    change_7d: 4.21,
    change_30d: 9.87,
    high_24h: 4020.00,
    low_24h: 3880.00,
    volume_24h: 18900000000,
    market_cap: 475000000000,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    balance: 156.49,
    available: 156.49,
    locked: 0,
    usd_value: 156.49,
    price_usd: 1.00,
    change_24h: 0.01,
    change_7d: 0.02,
    change_30d: 0.05,
    high_24h: 1.001,
    low_24h: 0.999,
    volume_24h: 89000000000,
    market_cap: 142000000000,
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    balance: 0.0,
    available: 0.0,
    locked: 0,
    usd_value: 0.0,
    price_usd: 218.50,
    change_24h: 3.25,
    change_7d: 8.15,
    change_30d: 22.45,
    high_24h: 225.00,
    low_24h: 210.00,
    volume_24h: 4560000000,
    market_cap: 120000000000,
  },
  BNB: {
    symbol: "BNB",
    name: "Binance Coin",
    balance: 0.0,
    available: 0.0,
    locked: 0,
    usd_value: 0.0,
    price_usd: 705.00,
    change_24h: 1.45,
    change_7d: 3.87,
    change_30d: 11.23,
    high_24h: 718.00,
    low_24h: 695.00,
    volume_24h: 2340000000,
    market_cap: 102000000000,
  },
}

// Dashboard stats (do frontend_dashboard.json)
export const mockDashboard = {
  total_balance_usd: 181.16,
  total_balance_brl: 999.77,
  total_positions: 0,
  total_orders_24h: 0,
  total_profit_loss: 0,
  active_strategies: 0,
  exchanges_online: 4, // MEXC, Bybit, OKX, NovaDAX
  timestamp: "2025-12-19T19:22:54.627397",
}

/**
 * Helper para simular delay de rede
 */
export const mockDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock responses para diferentes endpoints
 */
export const mockApiResponses = {
  // GET /balances
  getBalances: async () => {
    await mockDelay()
    return mockBalances
  },

  // GET /balances/history
  getBalanceHistory: async () => {
    await mockDelay()
    return mockBalanceHistory
  },

  // GET /exchanges (exchanges disponíveis)
  getAvailableExchanges: async () => {
    await mockDelay()
    return {
      exchanges: mockAvailableExchangesForApi,
      success: true,
      total: mockAvailableExchangesForApi.length,
    }
  },

  // GET /exchanges/linked (exchanges conectadas pelo usuário)
  getLinkedExchanges: async () => {
    await mockDelay()
    return {
      exchanges: mockExchanges,
      success: true,
      total: mockExchanges.length,
    }
  },

  // GET /tokens/available
  getAvailableTokens: async (exchangeId?: string) => {
    await mockDelay()
    // Retorna tokens no formato esperado pela API
    return mockAvailableTokens.map(token => ({
      symbol: token.symbol,
      name: token.name,
    }))
  },

  // GET /strategies
  getStrategies: async (userId: string) => {
    await mockDelay()
    return mockStrategies.filter(s => s.user_id === userId)
  },

  // POST /strategies
  createStrategy: async (data: any) => {
    await mockDelay()
    const newStrategy: Strategy = {
      _id: `mock_strategy_${Date.now()}`,
      id: `mock_strategy_${Date.now()}`,
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockStrategies.push(newStrategy)
    return newStrategy
  },

  // PUT /strategies/:id
  updateStrategy: async (id: string, data: any) => {
    await mockDelay()
    const index = mockStrategies.findIndex(s => s._id === id || s.id === id)
    if (index !== -1) {
      mockStrategies[index] = {
        ...mockStrategies[index],
        ...data,
        updated_at: new Date().toISOString(),
      }
      return mockStrategies[index]
    }
    throw new Error("Strategy not found")
  },

  // DELETE /strategies/:id
  deleteStrategy: async (id: string) => {
    await mockDelay()
    const index = mockStrategies.findIndex(s => s._id === id || s.id === id)
    if (index !== -1) {
      const deleted = mockStrategies.splice(index, 1)[0]
      return { message: "Strategy deleted", strategy: deleted }
    }
    throw new Error("Strategy not found")
  },

  // GET /exchanges/:exchangeId/token/:symbol
  getTokenDetails: async (exchangeId: string, symbol: string) => {
    await mockDelay()
    return mockTokenDetails[symbol as keyof typeof mockTokenDetails] || null
  },

  // GET /history/evolution
  getPortfolioEvolution: async (userId: string, days: number = 7) => {
    await mockDelay()
    
    // Pega os últimos N dias do mockBalanceHistory
    const historyData = mockBalanceHistory.slice(0, days)
    
    // Formata no formato esperado pela API
    const timestamps = historyData.map(h => h.timestamp)
    const values_usd = historyData.map(h => h.total_usd)
    const values_brl = historyData.map(h => h.total_brl)
    
    // Calcula o summary
    const start_value = values_usd[values_usd.length - 1]
    const end_value = values_usd[0]
    const min_value = Math.min(...values_usd)
    const max_value = Math.max(...values_usd)
    const change = end_value - start_value
    const change_percent = start_value > 0 ? (change / start_value) * 100 : 0
    
    return {
      user_id: userId,
      days: days,
      success: true,
      evolution: {
        timestamps,
        values_usd,
        values_brl,
        summary: {
          period_days: days,
          data_points: historyData.length,
          start_value_usd: start_value.toFixed(2),
          end_value_usd: end_value.toFixed(2),
          min_value_usd: min_value.toFixed(2),
          max_value_usd: max_value.toFixed(2),
          change_usd: change.toFixed(2),
          change_percent: change_percent.toFixed(2),
        }
      }
    }
  },

  // GET /dashboard
  getDashboard: async () => {
    await mockDelay()
    return mockDashboard
  },

  // POST /exchanges/connect
  connectExchange: async (data: any) => {
    await mockDelay(1000) // Simula conexão mais lenta
    // Encontra a exchange disponível
    const availableExchange = mockAvailableExchanges.find(
      e => e.exchange_id === data.exchange_id
    )
    if (!availableExchange) {
      throw new Error("Exchange not found")
    }
    
    // Adiciona às exchanges conectadas
    const connected = {
      ...availableExchange,
      user_id: data.user_id,
      api_key: data.api_key,
      api_secret: data.api_secret,
      passphrase: data.passphrase,
      status: "active" as const,
      is_active: true,
      linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    return {
      success: true,
      message: "Exchange connected successfully",
      exchange: connected,
    }
  },

  // POST /exchanges/disconnect
  disconnectExchange: async (exchangeId: string) => {
    await mockDelay()
    return {
      success: true,
      message: "Exchange disconnected successfully",
      exchange_id: exchangeId,
    }
  },

  // DELETE /exchanges/:id
  deleteExchange: async (exchangeId: string) => {
    await mockDelay()
    return {
      success: true,
      message: "Exchange deleted successfully",
      exchange_id: exchangeId,
    }
  },
}
