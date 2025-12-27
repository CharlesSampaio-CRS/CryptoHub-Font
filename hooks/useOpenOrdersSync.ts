/**
 * 🔄 Hook de Sincronização Automática de Ordens Abertas
 * 
 * Executa verificação de open orders automaticamente sempre que:
 * - A lista de tokens for atualizada (balance refresh)
 * - Uma nova exchange for adicionada
 * - O usuário forçar refresh manual
 * 
 * Performance:
 * - Usa cache agressivo (30s)
 * - Executa em background sem bloquear UI
 * - Chamadas paralelas por exchange
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
  const SYNC_DEBOUNCE_MS = 2000 // Evita syncs consecutivos muito rápidos

  const syncOpenOrders = useCallback(async () => {
    if (!enabled || !balanceData || isSyncingRef.current) {
      return
    }

    // Debounce: evita syncs muito frequentes
    const now = Date.now()
    if (now - lastSyncTimestampRef.current < SYNC_DEBOUNCE_MS) {
      console.log('🔄 [OpenOrdersSync] Skipping sync (debounced)')
      return
    }

    isSyncingRef.current = true
    lastSyncTimestampRef.current = now
    
    const startTime = Date.now()
    console.log('🔄 [OpenOrdersSync] Starting automatic open orders sync...')
    onSyncStart?.()

    try {
      const exchanges = balanceData.exchanges || []
      const results: SyncResult[] = []

      // Sincroniza ordens abertas para cada exchange em PARALELO
      const syncPromises = exchanges.map(async (exchange) => {
        const syncStartTime = Date.now()
        
        try {
          // useCache=true: usa cache de 30s por padrão
          const response = await apiService.getOpenOrders(
            userId,
            exchange.exchange_id,
            undefined, // symbol: undefined = todas as ordens
            true // useCache = true
          )

          const syncTimeMs = Date.now() - syncStartTime

          // Check for API error flags (graceful degradation from backend)
          const hasError = (response as any).auth_error || 
                          (response as any).exchange_error || 
                          (response as any).network_error ||
                          (response as any).not_supported ||
                          (response as any).error

          if (hasError) {
            const errorType: 'auth' | 'not_supported' | 'network' | 'exchange' = 
              (response as any).auth_error ? 'auth' :
              (response as any).not_supported ? 'not_supported' :
              (response as any).network_error ? 'network' :
              'exchange'
            
            console.warn(`⚠️ [OpenOrdersSync] ${exchange.name}: ${errorType} - ${(response as any).message || 'Unknown error'}`)
            
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

      console.log(`✅ [OpenOrdersSync] Completed in ${totalTime}ms:`, {
        exchanges: exchanges.length,
        success: successCount,
        cached: cachedCount,
        totalOrders,
        avgTimeMs: Math.round(totalTime / exchanges.length)
      })

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

    // Aguarda 500ms após mudança de balance para iniciar sync
    // Isso permite que a UI renderize primeiro
    const timer = setTimeout(() => {
      syncOpenOrders()
    }, 500)

    return () => clearTimeout(timer)
  }, [balanceData, enabled, syncOpenOrders])

  return {
    syncOpenOrders: syncOpenOrders as () => Promise<void>, // Força sync manual
    isSyncing: isSyncingRef.current
  }
}
