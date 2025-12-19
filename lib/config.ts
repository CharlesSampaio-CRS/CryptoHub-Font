/**
 * Configurações da aplicação
 */

// Estado mutável para o modo mock (pode ser alterado em runtime)
let useMockDataState = false

export const config = {
  /**
   * ID do usuário para buscar os balances
   * TODO: Implementar autenticação e gerenciamento de usuários
   */
  userId: 'charles_test_user',
  
  /**
   * URL base da API
   */
  apiBaseUrl: 'https://mex-api-prod.onrender.com/api/v1',
  
  /**
   * Modo de desenvolvimento - Use mock data para testes locais
   * true = usa dados mockados (offline)
   * false = usa API real
   */
  get useMockData() {
    return useMockDataState
  },
  
  /**
   * Alterna o modo mock
   */
  setMockMode(enabled: boolean) {
    useMockDataState = enabled
    console.log(`🧪 Modo Mock ${enabled ? 'ATIVADO' : 'DESATIVADO'}`)
  },
  
  /**
   * Verifica se está no modo mock
   */
  isMockMode() {
    return useMockDataState
  },
} as const;
