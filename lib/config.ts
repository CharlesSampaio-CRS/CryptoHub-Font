/**
 * Configurações da aplicação
 */

export const config = {
  /**
   * ID do usuário para buscar os balances
   * TODO: Implementar autenticação e gerenciamento de usuários
   */
  userId: 'charles_test_user',
  
  /**
   * URL base da API
   */
  apiBaseUrl: 'https://automatic-ncpu.onrender.com/api/v1',
} as const;
