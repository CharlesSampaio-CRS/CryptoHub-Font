import { BalanceResponse, AvailableExchangesResponse, LinkedExchangesResponse, PortfolioEvolutionResponse } from '@/types/api';
import { config } from '@/lib/config';
import { mockApiResponses } from '@/lib/mock-data';

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
  console.log(`🌐 Fetching: ${url} (timeout: ${timeout}ms, retries left: ${retries})`);
  const startTime = Date.now();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await Promise.race([
        fetch(url, options).then(response => {
          const duration = Date.now() - startTime;
          console.log(`✅ Response received in ${duration}ms: ${response.status} ${response.statusText}`);
          return response;
        }),
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

// Cache simples para portfolio evolution (5 minutos)
interface CacheEntry {
  data: PortfolioEvolutionResponse;
  timestamp: number;
}

const portfolioEvolutionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 300000; // 5 minutos (aumentado de 30s)

export const apiService = {
  /**
   * Busca os balances de todas as exchanges para um usuário
   * @param userId ID do usuário
   * @param forceRefresh Se true, força atualização sem cache (cache: false no backend)
   * @returns Promise com os dados de balance
   */
  async getBalances(userId: string, forceRefresh: boolean = false): Promise<BalanceResponse> {
    // 🧪 Se modo mock está ativo, retorna dados mockados
    if (config.isMockMode()) {
      console.log('🧪 [MOCK] Returning mock balances data');
      return mockApiResponses.getBalances();
    }

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
    // 🧪 Se modo mock está ativo, retorna dados mockados
    if (config.isMockMode()) {
      console.log('🧪 [MOCK] Returning mock balances summary');
      return mockApiResponses.getBalances();
    }

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
      console.log(`🚀 Summary loaded: ${data.summary.exchanges_count} exchanges in ${data.meta?.fetch_time || 'N/A'}s`);
      return data;
    } catch (error) {
      console.error('Error fetching balances summary:', error);
      throw error;
    }
  },

  /**
   * 📊 LAZY LOAD: Busca detalhes completos (tokens) de UMA exchange específica
   * Chamado quando usuário expande o card da exchange
   * @param userId ID do usuário
   * @param exchangeId MongoDB _id da exchange
   * @param includeVariations Se true, inclui variações de preço
   * @returns Promise com detalhes completos da exchange
   */
  async getExchangeDetails(userId: string, exchangeId: string, includeVariations: boolean = false): Promise<any> {
    try {
      const timestamp = Date.now();
      const variationsParam = includeVariations ? '&include_variations=true' : '';
      const url = `${API_BASE_URL}/balances/exchange/${exchangeId}?user_id=${userId}${variationsParam}&_t=${timestamp}`;
      
      console.log(`🌐 API Call: ${url}`);
      console.log(`📊 Include variations: ${includeVariations}, param: ${variationsParam}`);
      
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
      console.log(`📊 Exchange details loaded: ${data.name} - ${Object.keys(data.tokens || {}).length} tokens`);
      
      // Debug: verificar se as variações estão vindo
      if (data.tokens) {
        const firstToken = Object.entries(data.tokens)[0];
        if (firstToken) {
          const [symbol, tokenData]: [string, any] = firstToken;
          console.log(`📊 First token (${symbol}) data sample:`, {
            has_change_1h: !!tokenData.change_1h,
            has_change_4h: !!tokenData.change_4h,
            has_change_24h: !!tokenData.change_24h,
            change_1h: tokenData.change_1h,
            change_4h: tokenData.change_4h,
            change_24h: tokenData.change_24h
          });
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching exchange details:', error);
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
    // 🧪 Se modo mock está ativo, retorna dados mockados
    if (config.isMockMode()) {
      console.log('🧪 [MOCK] Returning mock available exchanges');
      return mockApiResponses.getAvailableExchanges();
    }

    try {
      const url = `${API_BASE_URL}/exchanges/available?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`;
      console.log('Fetching available exchanges from:', url, 'forceRefresh:', forceRefresh);
      
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
    // 🧪 Se modo mock está ativo, retorna dados mockados
    if (config.isMockMode()) {
      console.log('🧪 [MOCK] Returning mock linked exchanges');
      return mockApiResponses.getLinkedExchanges();
    }

    try {
      const url = `${API_BASE_URL}/exchanges/linked?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`;
      console.log('Fetching linked exchanges from:', url, 'forceRefresh:', forceRefresh);
      
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
    if (numValue === 0) return '$0.00';
    
    // Para valores muito pequenos, mostra até 10 casas decimais
    if (numValue < 0.01) {
      return '$' + numValue.toFixed(10).replace(/\.?0+$/, '');
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
    
    // Para valores muito pequenos, mostra até 10 casas decimais sem notação científica
    if (numValue < 0.000001) {
      return numValue.toFixed(10).replace(/\.?0+$/, '');
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 10,
    }).format(numValue);
  },

  /**
   * Busca o histórico de evolução do portfólio
   * @param userId ID do usuário
   * @param days Número de dias para buscar (padrão: 7)
   * @returns Promise com os dados de evolução
   */
  async getPortfolioEvolution(userId: string, days: number = 7): Promise<PortfolioEvolutionResponse> {
    // 🧪 Se modo mock está ativo, retorna dados mockados
    if (config.isMockMode()) {
      console.log('🧪 [MOCK] Returning mock portfolio evolution');
      return mockApiResponses.getPortfolioEvolution(userId, days);
    }

    const cacheKey = `${userId}-${days}`;
    const now = Date.now();

    // Verifica se existe cache válido
    const cached = portfolioEvolutionCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log('📊 Using cached portfolio evolution data');
      return cached.data;
    }

    try {
      const url = `${API_BASE_URL}/history/evolution?user_id=${userId}&days=${days}`;
      console.log('📊 Fetching portfolio evolution from:', url);
      
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
      console.log(`✅ Portfolio evolution fetched: ${days} days, ${data.evolution?.data?.length || 0} data points`);
      
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
      console.log('🔍 Searching token:', upperToken, 'at exchange:', exchangeId);
      
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
      console.log('✅ Token found:', data);
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
  }
};
