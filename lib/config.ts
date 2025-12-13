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
  apiBaseUrl: 'http://localhost:5000/api/v1',
} as const;
