import { BalanceResponse, AvailableExchangesResponse, LinkedExchangesResponse } from '@/types/api';
import { config } from '@/lib/config';

const API_BASE_URL = config.apiBaseUrl;

export const apiService = {
  /**
   * Busca os balances de todas as exchanges para um usuário
   * @param userId ID do usuário
   * @returns Promise com os dados de balance
   */
  async getBalances(userId: string): Promise<BalanceResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/balances?user_id=${userId}`);
      
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
   * Busca todas as exchanges disponíveis para conexão
   * @param userId ID do usuário
   * @param forceRefresh Força atualização sem cache
   * @returns Promise com a lista de exchanges disponíveis
   */
  async getAvailableExchanges(userId: string, forceRefresh: boolean = false): Promise<AvailableExchangesResponse> {
    try {
      const url = `${API_BASE_URL}/exchanges/available?user_id=${userId}${forceRefresh ? '&force_refresh=true' : ''}`;
      console.log('Fetching available exchanges from:', url, 'forceRefresh:', forceRefresh);
      
      // Apenas fazemos a requisição sem headers customizados para evitar CORS preflight
      const response = await fetch(url, { 
        method: 'GET',
        cache: forceRefresh ? 'no-store' : 'default'
      });
      
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
      console.log('Fetching linked exchanges from:', url, 'forceRefresh:', forceRefresh);
      
      // Apenas fazemos a requisição sem headers customizados para evitar CORS preflight
      const response = await fetch(url, { 
        method: 'GET',
        cache: forceRefresh ? 'no-store' : 'default'
      });
      
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
  }
};
