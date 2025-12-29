import { BalanceResponse, AvailableExchangesResponse, LinkedExchangesResponse, PortfolioEvolutionResponse } from '@/types/api';
import { config } from '@/lib/config';
import { cacheService, CacheService, CACHE_TTL } from './cache-service';
import { secureStorage } from '@/lib/secure-storage';

const API_BASE_URL = config.apiBaseUrl;

/**
 * Request timeout constants (in milliseconds)
 * Timeouts are configured based on operation complexity and cold start requirements
 */
const TIMEOUTS = {
  /** 5 seconds - Fast operations (single item fetch, token search) */
  FAST: 5000,
  
  /** 10 seconds - Standard operations (list exchanges, check availability) */
  STANDARD: 10000,
  
  /** 15 seconds - Normal operations (list with filters, token details, markets) */
  NORMAL: 15000,
  
  /** 30 seconds - Slow operations (create/update orders, complex calculations) */
  SLOW: 30000,
  
  /** 60 seconds - Very slow (cold start on Render, first request after idle) */
  VERY_SLOW: 60000,
  
  /** 120 seconds - Critical operations (full balance fetch with all exchanges/tokens) */
  CRITICAL: 120000,
} as const;

const MAX_RETRIES = 2;

// Helper para obter o token de autenticação
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const token = await secureStorage.getItemAsync('access_token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
  } catch (error) {
    console.warn('⚠️ Failed to get auth token:', error);
  }
  return {
    'Content-Type': 'application/json',
  };
}

// Helper para adicionar timeout às requisições com retry
async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout: number = TIMEOUTS.VERY_SLOW,
  retries = MAX_RETRIES
): Promise<Response> {
  const startTime = Date.now();
  
  // Adiciona headers de autenticação automaticamente
  const authHeaders = await getAuthHeaders();
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await Promise.race([
        fetch(url, mergedOptions),
        new Promise<Response>((_, reject) =>
          setTimeout(() => {
            reject(new Error(`Request timeout after ${timeout}ms`));
          }, timeout)
        )
      ]);
      
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (attempt < retries) {
        console.warn(`⚠️ Attempt ${attempt + 1} failed after ${duration}ms. Retrying...`);
        // Espera 1 segundo antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.error(`❌ All attempts failed after ${duration}ms:`, error.message);
        throw error;
      }
    }
  }
  
  throw new Error('Failed after all retries');
}

export const apiService = {
  /**
   * Busca os balances de todas as exchanges para um usuário
   * @param userId ID do usuário
   * @param forceRefresh Se true, força atualização sem cache (cache: false no backend)
   * @returns Promise com os dados de balance
   */
  async getBalances(userId: string, forceRefresh: boolean = false): Promise<BalanceResponse> {
    try {
      const cacheKey = CacheService.balanceKey(userId);
      
      // Check local cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheService.get<BalanceResponse>(cacheKey, CACHE_TTL.BALANCES);
        if (cached) {
          return cached;
        }
      }
      
      const timestamp = Date.now();
      const forceParam = forceRefresh ? '&force_refresh=true' : '';
      const url = `${API_BASE_URL}/balances?user_id=${userId}${forceParam}&_t=${timestamp}`;
      
      const response = await fetchWithTimeout(
        url,
        {
          cache: forceRefresh ? 'no-store' : 'default'
        },
        TIMEOUTS.CRITICAL // Full balance fetch can be slow with many exchanges/tokens
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: BalanceResponse = await response.json();
      
      // Cache locally (whether from backend cache or fresh data)
      if (!forceRefresh || (data as any).from_cache) {
        cacheService.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching balances:', error);
      throw error;
    }
  },

  /**
   * 🚀 FAST: Busca apenas os totais (summary) sem detalhes de tokens
   * Usado para carregamento inicial rápido (~1-2s)
   * @param userId ID do usuário
   * @param forceRefresh Se true, força atualização sem cache
   * @returns Promise com summary das exchanges (sem tokens)
   */
  async getBalancesSummary(userId: string, forceRefresh: boolean = false): Promise<BalanceResponse> {
    try {
      const cacheKey = CacheService.balanceSummaryKey(userId);
      
      // Check local cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheService.get<BalanceResponse>(cacheKey, CACHE_TTL.BALANCES);
        if (cached) {
          console.log('⚡ Returning balance summary from LOCAL cache');
          return cached;
        }
      }
      
      const timestamp = Date.now();
      const forceParam = forceRefresh ? '&force_refresh=true' : '';
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/balances/summary?user_id=${userId}${forceParam}&_t=${timestamp}`,
        {
          cache: forceRefresh ? 'no-store' : 'default'
        },
        TIMEOUTS.VERY_SLOW // Cold start tolerance
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: BalanceResponse = await response.json();
      
      // Cache locally
      if (!forceRefresh || (data as any).from_cache) {
        cacheService.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching balances summary:', error);
      throw error;
    }
  },

  /**
   * Busca a evolução do portfólio nos últimos N dias
   * @param userId ID do usuário
   * @param days Número de dias (padrão: 7)
   * @param forceRefresh Força atualização sem cache
   * @returns Promise com os dados de evolução
   */
  async getPortfolioEvolution(userId: string, days: number = 7, forceRefresh: boolean = false): Promise<PortfolioEvolutionResponse> {
    const cacheKey = CacheService.portfolioEvolutionKey(userId, days);

    // Check local cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cacheService.get<PortfolioEvolutionResponse>(cacheKey, CACHE_TTL.PORTFOLIO);
      if (cached) {
        console.log('⚡ Returning portfolio evolution from LOCAL cache');
        return cached;
      }
    }

    try {
      const url = `${API_BASE_URL}/history/evolution?user_id=${userId}&days=${days}${forceRefresh ? '&force_refresh=true' : ''}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: forceRefresh ? 'no-store' : 'default'
      }, TIMEOUTS.NORMAL);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache locally
      if (!forceRefresh || (data as any).from_cache) {
        cacheService.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching portfolio evolution:', error);
      throw error;
    }
  },

  async getExchangeDetails(userId: string, exchangeId: string, includeVariations: boolean = false): Promise<any> {
    try {
      const timestamp = Date.now();
      const variationsParam = includeVariations ? '&include_variations=true' : '';
      const url = `${API_BASE_URL}/balances/exchange/${exchangeId}?user_id=${userId}${variationsParam}&_t=${timestamp}`;
      
      const response = await fetchWithTimeout(
        url,
        {
          cache: 'default'
        },
        TIMEOUTS.STANDARD // Exchange details fetch
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('Error fetching exchange details:', error);
      throw error;
    }
  },

  /**
   * 🪙 Busca detalhes de um token específico com variações de preço
   * @param exchangeId MongoDB _id da exchange
   * @param symbol Símbolo do token (ex: BTC, ETH)
   * @param userId ID do usuário
   * @returns Promise com detalhes do token incluindo variações
   */
  async getTokenDetails(exchangeId: string, symbol: string, userId: string): Promise<any> {
    try {
      const url = `${API_BASE_URL}/exchanges/${exchangeId}/token/${symbol}?user_id=${userId}&include_variations=true`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        cache: 'default'
      }, TIMEOUTS.NORMAL); // Token details with price variations
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching token ${symbol} details:`, error);
      throw error;
    }
  },

  /**
   * Busca todas as exchanges disponíveis para conexão
   * @param userId ID do usuário
   * @param forceRefresh Força atualização sem cache
   * @returns Promise com a lista de exchanges disponíveis
   */
  async getAvailableExchanges(userId: string, forceRefresh: boolean = false): Promise<AvailableExchangesResponse> {
    try {
      const cacheKey = CacheService.availableExchangesKey(userId);
      
      // Check local cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheService.get<AvailableExchangesResponse>(cacheKey, CACHE_TTL.EXCHANGES);
        if (cached) {
          console.log('⚡ Returning available exchanges from LOCAL cache');
          return cached;
        }
      }
      
      const url = `${API_BASE_URL}/exchanges/available?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`;
      
      const response = await fetchWithTimeout(url, { 
        method: 'GET',
        cache: forceRefresh ? 'no-store' : 'default'
      }, TIMEOUTS.STANDARD); // List available exchanges
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: AvailableExchangesResponse = await response.json();
      
      // Cache locally
      if (!forceRefresh || (data as any).from_cache) {
        cacheService.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching available exchanges:', error);
      console.error('URL was:', `${API_BASE_URL}/exchanges/available?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`);
      throw error;
    }
  },

  /**
   * Busca as exchanges já conectadas do usuário
   * @param userId ID do usuário
   * @returns Promise com a lista de exchanges conectadas
   */
  async getLinkedExchanges(userId: string, forceRefresh: boolean = false): Promise<LinkedExchangesResponse> {
    try {
      const cacheKey = CacheService.linkedExchangesKey(userId);
      
      // Check local cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheService.get<LinkedExchangesResponse>(cacheKey, CACHE_TTL.EXCHANGES);
        if (cached) {
          console.log('⚡ Returning linked exchanges from LOCAL cache');
          return cached;
        }
      }
      
      const url = `${API_BASE_URL}/exchanges/linked?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`;
      
      const response = await fetchWithTimeout(url, { 
        method: 'GET',
        cache: forceRefresh ? 'no-store' : 'default'
      }, TIMEOUTS.STANDARD); // List linked exchanges
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: LinkedExchangesResponse = await response.json();
      
      // Cache locally
      if (!forceRefresh || (data as any).from_cache) {
        cacheService.set(cacheKey, data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching linked exchanges:', error);
      console.error('URL was:', `${API_BASE_URL}/exchanges/linked?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`);
      throw error;
    }
  },

  /**
   * Formata valores USD para exibição
   */
  formatUSD(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numValue === 0) return '0.00';
    
    // Para valores muito pequenos, mostra até 10 casas decimais
    if (numValue < 0.01) {
      return numValue.toFixed(10).replace(/\.?0+$/, '');
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 10,
    }).format(numValue);
  },

  /**
   * Formata quantidade de tokens
   */
  formatTokenAmount(amount: string): string {
    const numValue = parseFloat(amount);
    if (numValue === 0) return '0';
    
    // Para valores muito pequenos (< 0.000001), mostra até 10 casas decimais
    if (numValue < 0.000001) {
      return numValue.toFixed(10).replace(/\.?0+$/, '');
    }
    
    // Para valores grandes, usa abreviações
    if (numValue >= 1_000_000_000) {
      return `${(numValue / 1_000_000_000).toFixed(2)}Bi`;
    }
    if (numValue >= 1_000_000) {
      return `${(numValue / 1_000_000).toFixed(2)}Mi`;
    }
    if (numValue >= 1_000) {
      return `${(numValue / 1_000).toFixed(2)}K`;
    }
    
    // Para valores entre 0.000001 e 1, mostra até 3 casas decimais
    if (numValue < 1) {
      return numValue.toFixed(3);
    }
    
    // Para valores entre 1 e 1000, mostra até 2 casas decimais
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  },

  /**
   * Busca informações de um token em uma exchange específica
   * @param userId ID do usuário
   * @param exchangeId ID da exchange (MongoDB _id)
   * @param token Símbolo do token (ex: BTC, ETH, PEPE)
   * @returns Promise com os dados do token ou erro se não encontrado
   */
  async searchToken(userId: string, exchangeId: string, token: string): Promise<any> {
    try {
      const upperToken = token.toUpperCase();
      const url = `${API_BASE_URL}/tokens/search?user_id=${userId}&exchange_id=${exchangeId}&token=${upperToken}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        cache: 'no-store'
      }, TIMEOUTS.STANDARD); // Token search
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.warn(`⚠️ Token not found: ${response.status}`, errorData);
        return {
          success: false,
          message: errorData.message || 'Token não encontrado nesta exchange',
          error: errorData.error || 'NOT_FOUND'
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        ...data
      };
    } catch (error: any) {
      console.error('❌ Error searching token:', error);
      return {
        success: false,
        message: 'Erro ao buscar token. Tente novamente.',
        error: error.message
      };
    }
  },

  /**
   * Busca detalhes completos de uma exchange (fees, markets, etc)
   * @param exchangeId MongoDB _id da exchange
   * @param includeFees Se deve incluir informações de taxas
   * @param includeMarkets Se deve incluir informações de mercados
   * @param forceRefresh Se true, ignora o cache e busca dados frescos
   * @returns Promise com todos os detalhes da exchange
   */
  async getExchangeFullDetails(
    exchangeId: string, 
    includeFees: boolean = true, 
    includeMarkets: boolean = true,
    forceRefresh: boolean = false
  ): Promise<any> {
    const cacheKey = CacheService.exchangeDetailsKey(exchangeId, includeFees, includeMarkets);

    // Verifica se existe cache válido (somente se não forçar refresh)
    if (!forceRefresh) {
      const cached = cacheService.get<any>(cacheKey, CACHE_TTL.EXCHANGE_DETAILS);
      if (cached) {
        console.log('⚡ Returning exchange details from LOCAL cache');
        return cached;
      }
    }

    try {
      const feesParam = includeFees ? 'include_fees=true' : '';
      const marketsParam = includeMarkets ? 'include_markets=true' : '';
      const params = [feesParam, marketsParam].filter(p => p).join('&');
      const url = `${API_BASE_URL}/exchanges/${exchangeId}${params ? '?' + params : ''}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        cache: forceRefresh ? 'no-store' : 'default'
      }, TIMEOUTS.NORMAL); // Exchange full details
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache locally
      cacheService.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching exchange full details:', error);
      throw error;
    }
  },

  /**
   * Limpa o cache de detalhes de uma exchange específica ou de todas
   * @param exchangeId ID da exchange (opcional). Se não fornecido, limpa todo o cache
   */
  clearExchangeDetailsCache(exchangeId?: string) {
    if (exchangeId) {
      // Limpa apenas o cache da exchange específica usando pattern matching
      cacheService.invalidate(`exchange_details_${exchangeId}`);
    } else {
      // Limpa todo o cache de exchange details
      cacheService.invalidate('exchange_details_');
    }
  },

  /**
   * 📋 Busca ordens abertas de uma exchange específica
   * ⚡ SEM CACHE: Sempre busca dados frescos para garantir ordens atualizadas
   * 🛡️  RATE LIMIT: Backend limita 1 req/s por user+exchange
   * @param userId ID do usuário
   * @param exchangeId MongoDB _id da exchange
   * @param symbol (opcional) Par específico (ex: DOGE/USDT)
   * @returns Promise com a lista de ordens abertas
   */
  async getOpenOrders(userId: string, exchangeId: string, symbol?: string): Promise<any> {
    try {
      let url = `${API_BASE_URL}/orders/open?user_id=${userId}&exchange_id=${exchangeId}`;
      if (symbol) {
        url += `&symbol=${symbol}`;
      }
      
      // NO CACHE: sempre busca dados frescos
      console.log('🔄 Fetching fresh open orders from API (no cache)...');
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        cache: 'no-store' // Always get fresh data
      }, TIMEOUTS.NORMAL); // 15s timeout
      
      // Handle rate limit (429)
      if (response.status === 429) {
        const errorData = await response.json();
        console.warn('⚠️  Rate limit hit:', errorData.message);
        // Return empty orders instead of throwing (graceful degradation)
        return {
          success: true,
          count: 0,
          orders: [],
          rate_limited: true,
          message: errorData.message,
          retry_after: errorData.retry_after
        };
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // NO CACHE: retorna dados frescos diretamente
      return data;
    } catch (error) {
      console.error(`Error fetching open orders for exchange ${exchangeId}:`, error);
      throw error;
    }
  },

  /**
   * 📊 Cria ordem de compra (market ou limit)
   * @param userId ID do usuário
   * @param exchangeId MongoDB _id da exchange
   * @param token Símbolo do token (ex: BTC, DOGE)
   * @param amount Quantidade a comprar
   * @param orderType Tipo de ordem: 'market' ou 'limit'
   * @param price Preço (obrigatório para limit, opcional para market)
   * @returns Promise com resultado da ordem
   */
  async createBuyOrder(
    userId: string,
    exchangeId: string,
    token: string,
    amount: number,
    orderType: 'market' | 'limit',
    price?: number
  ): Promise<any> {
    try {
      const body: any = {
        user_id: userId,
        exchange_id: exchangeId,
        token: token,
        amount: amount,
        order_type: orderType,
      };

      // Adiciona preço apenas se for limit ou se foi fornecido
      if (orderType === 'limit' && price) {
        body.price = price;
      }

      console.log('🟢 [API] Criando ordem de COMPRA')
      console.log('📤 [API] URL:', `${API_BASE_URL}/orders/buy`)
      console.log('📤 [API] Body:', JSON.stringify(body, null, 2))

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/orders/buy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        TIMEOUTS.SLOW // Create buy order
      );

      console.log('📥 [API] Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [API] Erro da API:', errorData)
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [API] Resposta:', data)
      return data;
    } catch (error) {
      console.error('❌ [API] Error creating buy order:', error);
      throw error;
    }
  },

  /**
   * 📉 Cria ordem de venda (market ou limit)
   * @param userId ID do usuário
   * @param exchangeId MongoDB _id da exchange
   * @param token Símbolo do token (ex: BTC, DOGE)
   * @param amount Quantidade a vender
   * @param orderType Tipo de ordem: 'market' ou 'limit'
   * @param price Preço (obrigatório para limit, opcional para market)
   * @returns Promise com resultado da ordem
   */
  async createSellOrder(
    userId: string,
    exchangeId: string,
    token: string,
    amount: number,
    orderType: 'market' | 'limit',
    price?: number
  ): Promise<any> {
    try {
      const body: any = {
        user_id: userId,
        exchange_id: exchangeId,
        token: token,
        amount: amount,
        order_type: orderType,
      };

      // Adiciona preço apenas se for limit ou se foi fornecido
      if (orderType === 'limit' && price) {
        body.price = price;
      }

      console.log('🔴 [API] Criando ordem de VENDA')
      console.log('📤 [API] URL:', `${API_BASE_URL}/orders/sell`)
      console.log('📤 [API] Body:', JSON.stringify(body, null, 2))

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/orders/sell`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        TIMEOUTS.SLOW // Create sell order
      );

      console.log('📥 [API] Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [API] Erro da API:', errorData)
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [API] Resposta:', data)
      return data;
    } catch (error) {
      console.error('❌ [API] Error creating sell order:', error);
      throw error;
    }
  },

  /**
   * 💰 Consulta saldo disponível de um token específico
   * @param userId ID do usuário
   * @param exchangeId MongoDB _id da exchange
   * @param token Símbolo do token (ex: BTC, DOGE, USDT)
   * @returns Promise com saldo disponível, usado e total
   */
  async getTokenBalance(
    userId: string,
    exchangeId: string,
    token: string
  ): Promise<any> {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/exchanges/${exchangeId}/balance/${token}?user_id=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        TIMEOUTS.NORMAL // Normal operation
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  },

  /**
   * 📊 Lista tokens disponíveis para negociação (markets)
   * @param userId ID do usuário
   * @param exchangeId MongoDB _id da exchange
   * @param quote (opcional) Moeda de cotação (default: USDT)
   * @param search (opcional) Buscar token específico
   * @returns Promise com lista de markets e seus limites
   */
  async getMarkets(
    userId: string,
    exchangeId: string,
    quote: string = 'USDT',
    search?: string
  ): Promise<any> {
    try {
      let url = `${API_BASE_URL}/exchanges/${exchangeId}/markets?user_id=${userId}&quote=${quote}`;
      if (search) {
        url += `&search=${search}`;
      }

      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        TIMEOUTS.NORMAL // Normal operation
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting markets:', error);
      throw error;
    }
  },

  /**
   * 📜 Histórico de ordens fechadas/canceladas (com cache de 5 min)
   * @param userId ID do usuário
   * @param exchangeId MongoDB _id da exchange
   * @param symbol (opcional) Par específico (ex: BTC/USDT)
   * @param limit (opcional) Número de ordens (default: 100, max: 500)
   * @param useCache (opcional) Usar cache (default: true)
   * @returns Promise com histórico de ordens
   */
  async getOrderHistory(
    userId: string,
    exchangeId: string,
    symbol?: string,
    limit: number = 100,
    useCache: boolean = true
  ): Promise<any> {
    try {
      let url = `${API_BASE_URL}/orders/history?user_id=${userId}&exchange_id=${exchangeId}&limit=${limit}&use_cache=${useCache}`;
      if (symbol) {
        url += `&symbol=${symbol}`;
      }

      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        TIMEOUTS.NORMAL // Normal operation
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting order history:', error);
      throw error;
    }
  },

  /**
   * ❌ Cancela uma ordem aberta
   * @param userId ID do usuário
   * @param orderId ID da ordem a cancelar
   * @param exchangeId ID da exchange (opcional mas recomendado)
   * @param symbol Par de negociação (opcional mas recomendado)
   * @returns Promise com resultado do cancelamento
   */
  async cancelOrder(
    userId: string,
    orderId: string,
    exchangeId?: string,
    symbol?: string
  ): Promise<any> {
    try {
      console.log('🔴 [API] Cancelando ordem')
      console.log('📤 [API] URL:', `${API_BASE_URL}/orders/cancel`)
      
      const body = {
        user_id: userId,
        order_id: orderId,
        ...(exchangeId && { exchange_id: exchangeId }),
        ...(symbol && { symbol })
      }
      
      console.log('📤 [API] Body:', JSON.stringify(body, null, 2))
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/orders/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        TIMEOUTS.NORMAL // Normal operation
      );

      console.log('📥 [API] Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [API] Erro da API:', errorData)
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [API] Resposta:', data)
      return data;
    } catch (error) {
      console.error('❌ [API] Error canceling order:', error);
      throw error;
    }
  },

  /**
   * Cancela todas as ordens abertas de uma exchange
   * @param userId ID do usuário
   * @param exchangeId ID da exchange
   * @returns Promise com resultado do cancelamento
   */
  async cancelAllOrders(
    userId: string,
    exchangeId: string
  ): Promise<any> {
    try {
      console.log('🔴 [API] Cancelando TODAS as ordens da exchange:', exchangeId)
      console.log('📤 [API] URL:', `${API_BASE_URL}/orders/cancel-all`)
      
      const body = {
        user_id: userId,
        exchange_id: exchangeId
      }
      
      console.log('📤 [API] Body:', JSON.stringify(body, null, 2))
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/orders/cancel-all`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        TIMEOUTS.SLOW // Cancel all orders
      );

      console.log('📥 [API] Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [API] Erro da API:', errorData)
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [API] Resposta:', data)
      return data;
    } catch (error) {
      console.error('❌ [API] Error canceling all orders:', error);
      throw error;
    }
  },

  /**
   * Edita uma ordem existente (preço e/ou quantidade)
   * @param userId ID do usuário
   * @param orderId ID da ordem
   * @param exchangeId ID da exchange
   * @param symbol Par de negociação
   * @param newPrice Novo preço (opcional)
   * @param newAmount Nova quantidade (opcional)
   * @returns Promise com resultado da edição
   */
  async editOrder(
    userId: string,
    orderId: string,
    exchangeId: string,
    symbol: string,
    newPrice?: number,
    newAmount?: number
  ): Promise<any> {
    try {
      console.log('✏️ [API] Editando ordem:', orderId)
      console.log('📤 [API] URL:', `${API_BASE_URL}/orders/edit`)
      
      const body: any = {
        user_id: userId,
        order_id: orderId,
        exchange_id: exchangeId,
        symbol: symbol
      }
      
      if (newPrice !== undefined) body.price = newPrice
      if (newAmount !== undefined) body.amount = newAmount
      
      console.log('📤 [API] Body:', JSON.stringify(body, null, 2))
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/orders/edit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        TIMEOUTS.NORMAL // Normal operation
      );

      console.log('📥 [API] Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [API] Erro da API:', errorData)
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [API] Resposta:', data)
      return data;
    } catch (error) {
      console.error('❌ [API] Error editing order:', error);
      throw error;
    }
  },

  /**
   * Invalida o cache de ordens abertas para um usuário/exchange específico
   * Usado após criar ou cancelar ordens para forçar atualização
   */
  invalidateOrdersCache(userId: string, exchangeId: string) {
    console.log('🗑️ [API] Invalidando cache de ordens para:', { userId, exchangeId })
    // O cache está no componente OpenOrdersModal, não aqui
    // Este método serve como trigger para componentes que importam este serviço
    // Os componentes podem usar este método como sinal para limpar seus próprios caches
  },

  /**
   * Retorna informações sobre o cache atual
   */
  getCacheInfo() {
    return cacheService.getStats();
  }
};
