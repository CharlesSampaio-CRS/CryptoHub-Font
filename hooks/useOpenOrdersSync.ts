/**
 * 🔄 Hook de Sincronização Automática de Ordens Abertas
 * 
 * Executa verificação de open orders automaticamente sempre que:
 * - A lista de tokens for atualizada (balance refresh)
 * - Uma nova exchange for adicionada
 * - O usuário forçar refresh manual
 * 
 * Performance:
 * - Usa cache agressivo (30s no backend)
 * - Debounce leve (500ms no frontend) - backend já tem cache!
 * - Executa em background sem bloquear UI
 * - Chamadas paralelas por exchange
 * 
 * Smart Debouncing:
 * - Auto-sync: respeita debounce de 500ms
 * - Manual sync: ignora debounce (força atualização)
 */

import { useEffect, useRef, useCallback } from 'react'
import { useBalance } from '@/contexts/BalanceContext'
import { apiService } from '@/services/api'

interface UseOpenOrdersSyncOptions {
  userId: string
  enabled?: boolean // Permite desabilitar o sync
  onSyncStart?: () => void
  onSyncComplete?: (results: SyncResult[]) => void
  onSyncError?: (error: Error) => void
}

interface SyncResult {
  exchangeId: string
  exchangeName: string
  ordersCount: number
  success: boolean
  error?: string
  fromCache: boolean
  syncTimeMs: number
  warning?: 'auth' | 'not_supported' | 'network' | 'exchange' // New: graceful degradation flags
}

export function useOpenOrdersSync({
  userId,
  enabled = true,
  onSyncStart,
  onSyncComplete,
  onSyncError
}: UseOpenOrdersSyncOptions) {
  const { data: balanceData } = useBalance()
  const isSyncingRef = useRef(false)
  const lastSyncTimestampRef = useRef<number>(0)
  const pendingTimerRef = useRef<NodeJS.Timeout | null>(null) // NEW: Track pending timer
  const lastBalanceHashRef = useRef<string>('') // NEW: Track balance changes
  const SYNC_DEBOUNCE_MS = 500 // Reduzido: Backend já tem cache de 30s, debounce pode ser menor

  const syncOpenOrders = useCallback(async (force = false) => {
    if (!enabled || !balanceData || isSyncingRef.current) {
      // Silencioso: console.log('🔄 [OpenOrdersSync] Skipping sync (disabled, no data, or already syncing)')
      return
    }

    // Debounce: evita syncs muito frequentes (exceto se force=true)
    const now = Date.now()
    if (!force && now - lastSyncTimestampRef.current < SYNC_DEBOUNCE_MS) {
      // Silencioso: console.log('🔄 [OpenOrdersSync] Skipping sync (debounced - too soon since last sync)')
      return
    }

    isSyncingRef.current = true
    lastSyncTimestampRef.current = now
    
    const startTime = Date.now()
    // Silencioso: console.log('🔄 [OpenOrdersSync] Starting automatic open orders sync...')
    onSyncStart?.()

    try {
      const exchanges = balanceData.exchanges || []
      const results: SyncResult[] = []

      // Sincroniza ordens abertas para cada exchange em PARALELO
      const syncPromises = exchanges.map(async (exchange) => {
        const syncStartTime = Date.now()
        
        try {
          // NO CACHE: sempre busca dados frescos
          const response = await apiService.getOpenOrders(
            userId,
            exchange.exchange_id,
            undefined // symbol: undefined = todas as ordens
          )

          const syncTimeMs = Date.now() - syncStartTime

          // Check for API error flags (graceful degradation from backend)
          const hasError = (response as any).auth_error || 
                          (response as any).exchange_error || 
                          (response as any).network_error ||
                          (response as any).not_supported ||
                          (response as any).rate_limited ||
                          (response as any).error

          if (hasError) {
            const errorType: 'auth' | 'not_supported' | 'network' | 'exchange' = 
              (response as any).auth_error ? 'auth' :
              (response as any).not_supported ? 'not_supported' :
              (response as any).network_error ? 'network' :
              (response as any).rate_limited ? 'network' : // Trata rate limit como network error
              'exchange'
            
            const errorMsg = (response as any).rate_limited 
              ? `Rate limited - ${(response as any).message}`
              : (response as any).message || 'Unknown error'
            
            console.warn(`⚠️ [OpenOrdersSync] ${exchange.name}: ${errorType} - ${errorMsg}`)
            
            return {
              exchangeId: exchange.exchange_id,
              exchangeName: exchange.name,
              ordersCount: 0,
              success: true, // Still "success" to not break flow
              fromCache: false,
              syncTimeMs,
              warning: errorType
            }
          }

          return {
            exchangeId: exchange.exchange_id,
            exchangeName: exchange.name,
            ordersCount: response.orders?.length || 0,
            success: true,
            fromCache: response.from_cache || false,
            syncTimeMs
          }
        } catch (error) {
          const syncTimeMs = Date.now() - syncStartTime
          
          // Log warning instead of error (graceful degradation)
          console.warn(`⚠️ [OpenOrdersSync] Failed to sync ${exchange.name}:`, error)
          
          return {
            exchangeId: exchange.exchange_id,
            exchangeName: exchange.name,
            ordersCount: 0,
            success: true, // Mark as success to not break flow
            error: error instanceof Error ? error.message : String(error),
            fromCache: false,
            syncTimeMs
          }
        }
      })

      // Espera todas as sincronizações completarem
      const syncResults = await Promise.allSettled(syncPromises)
      
      // Processa resultados
      syncResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        }
      })

      const totalTime = Date.now() - startTime
      const successCount = results.filter(r => r.success).length
      const cachedCount = results.filter(r => r.fromCache).length
      const totalOrders = results.reduce((sum, r) => sum + r.ordersCount, 0)

      // Silencioso: apenas em caso de erro será logado
      // console.log(`✅ [OpenOrdersSync] Completed in ${totalTime}ms:`, {
      //   exchanges: exchanges.length,
      //   success: successCount,
      //   cached: cachedCount,
      //   totalOrders,
      //   avgTimeMs: Math.round(totalTime / exchanges.length)
      // })

      onSyncComplete?.(results)

    } catch (error) {
      const totalTime = Date.now() - startTime
      console.error(`❌ [OpenOrdersSync] Failed after ${totalTime}ms:`, error)
      onSyncError?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      isSyncingRef.current = false
    }
  }, [userId, balanceData, enabled, onSyncStart, onSyncComplete, onSyncError])

  // Auto-sync quando balanceData mudar
  useEffect(() => {
    if (!enabled || !balanceData) {
      return
    }

    // Cancela timer pendente se existir (evita múltiplas chamadas)
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = null
    }

    // Cria hash simples do balance para detectar mudanças reais
    const balanceHash = JSON.stringify(balanceData.exchanges?.map(e => ({
      id: e.exchange_id,
      tokensCount: e.tokens?.length || 0
    })) || [])

    // Se o balance não mudou de verdade, não faz nada
    if (balanceHash === lastBalanceHashRef.current) {
      // Silencioso: console.log('🔄 [OpenOrdersSync] Balance unchanged, skipping auto-sync')
      return
    }

    lastBalanceHashRef.current = balanceHash
    // Silencioso: console.log('🔄 [OpenOrdersSync] Balance changed, scheduling auto-sync in 500ms...')

    // Aguarda 500ms após mudança de balance para iniciar sync
    // Isso permite que a UI renderize primeiro E evita múltiplas chamadas
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null
      syncOpenOrders(false) // Auto-sync respeita debounce
    }, 500)

    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current)
        pendingTimerRef.current = null
      }
    }
    // IMPORTANTE: NÃO incluir syncOpenOrders nas dependências para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceData, enabled])

  return {
    syncOpenOrders: ((force = true) => syncOpenOrders(force)) as (force?: boolean) => Promise<void>, // Manual sync ignora debounce por padrão
    isSyncing: isSyncingRef.current
  }
}
