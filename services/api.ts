import { BalanceResponse, AvailableExchangesResponse, LinkedExchangesResponse, PortfolioEvolutionResponse } from '@/types/api';
import { config } from '@/lib/config';

const API_BASE_URL = config.apiBaseUrl;

// Timeout padrão para requisições (60 segundos para cold start do Render)
const DEFAULT_TIMEOUT = 60000;
const MAX_RETRIES = 2;

// Helper para adicionar timeout às requisições com retry
async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout = DEFAULT_TIMEOUT,
  retries = MAX_RETRIES
): Promise<Response> {
  const startTime = Date.now();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await Promise.race([
        fetch(url, options),
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

// Cache para detalhes completos das exchanges (fees, markets, etc)
interface ExchangeDetailsCacheEntry {
  data: any;
  timestamp: number;
}

const exchangeDetailsCache = new Map<string, ExchangeDetailsCacheEntry>();
const EXCHANGE_DETAILS_CACHE_TTL = 3600000; // 1 hora (dados de fees e markets mudam raramente)

// Cache para evolução do portfólio
interface PortfolioEvolutionCacheEntry {
  data: PortfolioEvolutionResponse;
  timestamp: number;
}

const portfolioEvolutionCache = new Map<string, PortfolioEvolutionCacheEntry>();
const PORTFOLIO_EVOLUTION_CACHE_TTL = 300000; // 5 minutos

export const apiService = {
  /**
   * Busca os balances de todas as exchanges para um usuário
   * @param userId ID do usuário
   * @param forceRefresh Se true, força atualização sem cache (cache: false no backend)
   * @returns Promise com os dados de balance
   */
  async getBalances(userId: string, forceRefresh: boolean = false): Promise<BalanceResponse> {
    try {
      const timestamp = Date.now();
      // Só adiciona force_refresh=true quando explicitamente solicitado
      const forceParam = forceRefresh ? '&force_refresh=true' : '';
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/balances?user_id=${userId}${forceParam}&_t=${timestamp}`,
        {
          cache: forceRefresh ? 'no-store' : 'default'
        },
        120000 // 120s (2 minutos) timeout para balances completos - pode demorar quando force_refresh=true
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: BalanceResponse = await response.json();
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
      const timestamp = Date.now();
      const forceParam = forceRefresh ? '&force_refresh=true' : '';
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/balances/summary?user_id=${userId}${forceParam}&_t=${timestamp}`,
        {
          cache: forceRefresh ? 'no-store' : 'default'
        },
        DEFAULT_TIMEOUT // 60s timeout (aumentado para cold start)
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: BalanceResponse = await response.json();
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
   * @returns Promise com os dados de evolução
   */
  async getPortfolioEvolution(userId: string, days: number = 7): Promise<PortfolioEvolutionResponse> {
    const cacheKey = `${userId}-${days}`;
    const now = Date.now();

    // Verifica se existe cache válido
    const cached = portfolioEvolutionCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < PORTFOLIO_EVOLUTION_CACHE_TTL) {
      return cached.data;
    }

    try {
      const url = `${API_BASE_URL}/history/evolution?user_id=${userId}&days=${days}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }, 15000);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Armazena no cache
      portfolioEvolutionCache.set(cacheKey, {
        data,
        timestamp: now
      });

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
        10000 // 10s timeout
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
      }, 15000); // 15s timeout (aumentado de 5s) para tokens que demoram mais
      
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
      const url = `${API_BASE_URL}/exchanges/available?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`;
      
      // Apenas fazemos a requisição sem headers customizados para evitar CORS preflight
      const response = await fetchWithTimeout(url, { 
        method: 'GET',
        cache: forceRefresh ? 'no-store' : 'default'
      }, 10000);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: AvailableExchangesResponse = await response.json();
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
      const url = `${API_BASE_URL}/exchanges/linked?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`;
      
      // Apenas fazemos a requisição sem headers customizados para evitar CORS preflight
      const response = await fetchWithTimeout(url, { 
        method: 'GET',
        cache: forceRefresh ? 'no-store' : 'default'
      }, 10000);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data: LinkedExchangesResponse = await response.json();
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
      }, 10000);
      
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
    const cacheKey = `${exchangeId}-${includeFees}-${includeMarkets}`;
    const now = Date.now();

    // Verifica se existe cache válido (somente se não forçar refresh)
    if (!forceRefresh) {
      const cached = exchangeDetailsCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < EXCHANGE_DETAILS_CACHE_TTL) {
        return cached.data;
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
      }, 15000); // 15s timeout
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Armazena no cache
      exchangeDetailsCache.set(cacheKey, {
        data,
        timestamp: now
      });
      
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
      // Limpa apenas o cache da exchange específica
      const keysToDelete: string[] = [];
      exchangeDetailsCache.forEach((_, key) => {
        if (key.startsWith(exchangeId)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => exchangeDetailsCache.delete(key));
    } else {
      // Limpa todo o cache
      exchangeDetailsCache.clear();
    }
  },

  /**
   * 📋 Busca ordens abertas de uma exchange específica
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
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        cache: 'no-store' // Sempre busca dados atualizados de ordens
      }, 15000); // 15s timeout
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
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
        30000 // 30s timeout
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
        30000 // 30s timeout
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
        15000 // 15s timeout
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
        15000 // 15s timeout
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
        15000 // 15s timeout
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
        15000 // 15s timeout
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
    return {
      exchangeDetails: {
        size: exchangeDetailsCache.size,
        ttl: EXCHANGE_DETAILS_CACHE_TTL,
        entries: Array.from(exchangeDetailsCache.keys())
      }
    };
  }
};
