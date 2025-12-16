import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { Platform } from 'react-native'
import { apiService } from '@/services/api'
import { BalanceResponse } from '@/types/api'
import { config } from '@/lib/config'

// Event emitter simples para React Native
const listeners = new Set<() => void>()

interface BalanceContextType {
  data: BalanceResponse | null
  loading: boolean
  error: string | null
  refreshing: boolean
  fetchBalances: (forceRefresh?: boolean, emitEvent?: boolean, silent?: boolean, useSummary?: boolean) => Promise<void>
  refresh: () => Promise<void>
  refreshOnExchangeChange: () => Promise<void>
  fetchExchangeDetails: (exchangeId: string) => Promise<any>
  updateExchangeInCache: (exchangeId: string, exchangeData: any) => void
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBalances = useCallback(async (forceRefresh = false, emitEvent = false, silent = false, useSummary = false) => {
    try {
      // Controle inteligente de loading states
      if (!silent && !data) {
        setLoading(true)
      } else if (!silent && forceRefresh) {
        setRefreshing(true)
      }
      setError(null)
      
      console.log(`📊 BalanceContext: Buscando ${useSummary ? 'summary' : 'balances'} (forceRefresh=${forceRefresh}, silent=${silent})`)
      
      // Usa summary (rápido) ou balances completo (com tokens)
      const response = useSummary 
        ? await apiService.getBalancesSummary(config.userId, forceRefresh)
        : await apiService.getBalances(config.userId, forceRefresh)
      
      console.log(`✅ BalanceContext: Recebido ${response.exchanges?.length || 0} exchanges`)
      if (response.exchanges) {
        response.exchanges.forEach(ex => {
          const tokenCount = Object.keys(ex.tokens || {}).length
          console.log(`   - ${ex.name}: ${ex.success ? '✓' : '✗'} ${tokenCount > 0 ? `(${tokenCount} tokens)` : '(summary only)'}`)
        })
      }
      
      setData(response)
      
      // Emite evento para outros componentes que precisem saber da atualização
      if (emitEvent) {
        setTimeout(() => {
          // Notifica todos os listeners
          listeners.forEach(listener => listener())
        }, 100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances')
      console.error('Error fetching balances:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [data])

  const refresh = useCallback(async () => {
    await fetchBalances(true, true, false)
  }, [fetchBalances])

  // Função específica para atualizar quando exchanges mudam
  const refreshOnExchangeChange = useCallback(async () => {
    console.log('🔄 refreshOnExchangeChange: Iniciando atualização de balances após mudança de exchange')
    // Atualiza com cache: false, de forma silenciosa, e emite evento
    await fetchBalances(true, true, true)
    console.log('✅ refreshOnExchangeChange: Atualização concluída')
  }, [fetchBalances])

  // Fetch inicial usando SUMMARY (rápido ~1-2s)
  useEffect(() => {
    fetchBalances(false, false, false, true) // forceRefresh=false, emitEvent=false, silent=false, useSummary=true
  }, [])

  // Auto-refresh a cada 5 minutos de forma silenciosa com cache: false
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh: Atualizando balances (5 minutos)')
      fetchBalances(true, false, true) // forceRefresh=true, silent=true
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [fetchBalances])

  // Listener para eventos externos (como exchanges-manager)
  useEffect(() => {
    const handleBalancesUpdate = () => {
      setTimeout(() => fetchBalances(true, false, true), 100)
    }
    
    // Adiciona listener ao Set
    listeners.add(handleBalancesUpdate)
    
    return () => {
      // Remove listener na limpeza
      listeners.delete(handleBalancesUpdate)
    }
  }, [fetchBalances])

  // 📊 Lazy load: Busca detalhes de UMA exchange específica
  const fetchExchangeDetails = useCallback(async (exchangeId: string) => {
    try {
      console.log(`📊 Fetching details for exchange: ${exchangeId}`)
      const details = await apiService.getExchangeDetails(config.userId, exchangeId, false)
      return details
    } catch (err) {
      console.error('Error fetching exchange details:', err)
      throw err
    }
  }, [])

  // Atualiza uma exchange específica no cache local
  const updateExchangeInCache = useCallback((exchangeId: string, exchangeData: any) => {
    if (!data) return
    
    const updatedExchanges = data.exchanges.map(ex => {
      if (ex.exchange_id === exchangeId) {
        return { ...ex, ...exchangeData }
      }
      return ex
    })
    
    setData({ ...data, exchanges: updatedExchanges })
  }, [data])

  const value = useMemo(() => ({
    data,
    loading,
    error,
    refreshing,
    fetchBalances,
    refresh,
    refreshOnExchangeChange,
    fetchExchangeDetails,
    updateExchangeInCache
  }), [data, loading, error, refreshing, fetchBalances, refresh, refreshOnExchangeChange, fetchExchangeDetails, updateExchangeInCache])

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider')
  }
  return context
}
