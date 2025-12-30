/**
 * Configurações da aplicação
 */

import { secureStorage } from './secure-storage'

export const config = {
  /**
   * URL base da API (Backend Flask - Trading/Balances)
   */
  apiBaseUrl: 'http://localhost:5000/api/v1',
  
  /**
   * URL base do Kong Security API (OAuth/JWT)
   * NOTA: Por enquanto, usando o backend Python para auth até implementar no Rust
   */
  kongBaseUrl: 'http://localhost:5000/api/v1',
}

/**
 * Obtém o ID do usuário logado do storage
 * @returns Promise com o user_id ou null se não estiver logado
 */
export async function getUserId(): Promise<string | null> {
  try {
    const userId = await secureStorage.getItemAsync('user_id')
    return userId
  } catch (error) {
    console.error('Error getting user_id:', error)
    return null
  }
}

/**
 * @deprecated Use getUserId() instead. This is kept for backward compatibility only.
 */
export const getUserIdSync = () => {
  console.warn('⚠️ getUserIdSync is deprecated. Use getUserId() instead or get user.id from AuthContext')
  return 'charles_test_user' // Fallback para desenvolvimento
}
