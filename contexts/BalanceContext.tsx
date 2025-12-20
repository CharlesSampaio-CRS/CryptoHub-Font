import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
  const isRefreshingRef = useRef(false) // Ref para controle imediato

  const fetchBalances = useCallback(async (forceRefresh = false, emitEvent = false, silent = false, useSummary = false) => {
    try {
      console.log('🔄 fetchBalances chamado:', { forceRefresh, emitEvent, silent, useSummary })
      
      // Controle inteligente de loading states
      if (!silent && !data) {
        console.log('📊 setLoading(true) - primeira carga')
        setLoading(true)
      } else if (!silent && forceRefresh) {
        console.log('🔄 setRefreshing(true) - refresh manual')
        setRefreshing(true)
        isRefreshingRef.current = true // Marca ref imediatamente
      }
      setError(null)
      
      // Usa summary (rápido) ou balances completo (com tokens)
      const response = useSummary 
        ? await apiService.getBalancesSummary(config.userId, forceRefresh)
        : await apiService.getBalances(config.userId, forceRefresh)
      
      console.log('✅ Dados recebidos:', {
        exchanges: response.exchanges?.length || 0,
        totalExchanges: response.summary?.exchanges_count,
        timestamp: response.timestamp,
        firstExchange: response.exchanges?.[0] ? {
          name: response.exchanges[0].name,
          tokensCount: Object.keys(response.exchanges[0].tokens || {}).length,
          tokens: Object.keys(response.exchanges[0].tokens || {}).slice(0, 3)
        } : null
      })
      
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
      // Aguarda um pouco para garantir que a UI atualize antes de parar a animação
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('✅ fetchBalances finally: setLoading(false) e setRefreshing(false)')
      setLoading(false)
      setRefreshing(false)
      isRefreshingRef.current = false // Libera ref
    }
  }, [data])

  const refresh = useCallback(async () => {
    // Previne múltiplas chamadas simultâneas usando ref (verificação síncrona)
    if (isRefreshingRef.current) {
      console.log('⏭️ BalanceContext.refresh: Já está atualizando (ref check), ignorando chamada duplicada')
      return
    }
    
    console.log('🔄 BalanceContext.refresh: Forçando atualização COMPLETA (sem cache)')
    await fetchBalances(true, true, false, false) // forceRefresh=TRUE (sem cache), emitEvent=true, silent=false, useSummary=FALSE
  }, [fetchBalances])

  // Função específica para atualizar quando exchanges mudam
  const refreshOnExchangeChange = useCallback(async () => {
    console.log('🔄 refreshOnExchangeChange: Iniciando atualização de balances após mudança de exchange')
    // Atualiza com cache: false, de forma silenciosa, e emite evento
    await fetchBalances(true, true, true)
    console.log('✅ refreshOnExchangeChange: Atualização concluída')
  }, [fetchBalances])

  // Fetch inicial DESABILITADO - será feito pelo DataLoader no App.tsx após login
  // useEffect(() => {
  //   console.log('📊 BalanceContext: Carregamento inicial COMPLETO (com todos os tokens)')
  //   fetchBalances(false, false, false, false) // forceRefresh=FALSE (usa cache), emitEvent=false, silent=false, useSummary=FALSE
  // }, [])

  // Auto-refresh a cada 5 minutos de forma silenciosa com dados COMPLETOS
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh: Atualizando balances COMPLETOS (5 minutos)')
      fetchBalances(true, false, true, false) // forceRefresh=true, silent=true, useSummary=FALSE
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [fetchBalances])

  // Listener para eventos externos (como exchanges-manager)
  useEffect(() => {
    const handleBalancesUpdate = () => {
      console.log('🔔 BalanceContext: Evento externo - atualizando COMPLETO')
      setTimeout(() => fetchBalances(true, false, true, false), 100) // useSummary=FALSE
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
      const details = await apiService.getExchangeDetails(config.userId, exchangeId, true)
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
