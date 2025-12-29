import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 're    if (user?.id && !hasFetchedInitialRef.current) {
      hasFetchedInitialRef.current = true // Marca como fetched ANTES da chamada async'
import { Platform } from 'react-native'
import { apiService } from '@/services/api'
import { BalanceResponse } from '@/types/api'
import { config } from '@/lib/config'
import { useAuth } from './AuthContext'

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
  const { user } = useAuth() // Obtém o usuário autenticado
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const isRefreshingRef = useRef(false) // Ref para controle imediato
  const hasFetchedInitialRef = useRef(false) // Ref para controlar fetch inicial

  const fetchBalances = useCallback(async (forceRefresh = false, emitEvent = false, silent = false, useSummary = false) => {
    try {
      // Se não tem usuário autenticado, não faz nada
      if (!user?.id) {
        console.warn('⚠️ [BalanceContext] No user ID available, skipping balance fetch')
        setLoading(false)
        return
      }
      
      // Controle inteligente de loading states
      if (!silent && !data) {
        setLoading(true)
      } else if (!silent && forceRefresh) {
        setRefreshing(true)
        isRefreshingRef.current = true // Marca ref imediatamente
      }
      setError(null)
      
      // Usa summary (rápido) ou balances completo (com tokens)
      const response = useSummary 
        ? await apiService.getBalancesSummary(user.id, forceRefresh)
        : await apiService.getBalances(user.id, forceRefresh)
      
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
      
      setLoading(false)
      setRefreshing(false)
      isRefreshingRef.current = false // Libera ref
    }
  }, [user, data]) // Adiciona user como dependência

  const refresh = useCallback(async () => {
    // Previne múltiplas chamadas simultâneas usando ref (verificação síncrona)
    if (isRefreshingRef.current) {
      console.log('⚠️ [BalanceContext] Already refreshing, skipping')
      return
    }
    
    // NÃO emite evento no refresh manual para evitar loop circular
    await fetchBalances(true, false, false, false) // forceRefresh=TRUE, emitEvent=FALSE, silent=false, useSummary=FALSE
  }, [fetchBalances])

  // Função específica para atualizar quando exchanges mudam
  const refreshOnExchangeChange = useCallback(async () => {
    // Atualiza com cache: false, de forma silenciosa, e emite evento
    await fetchBalances(true, true, true)
  }, [fetchBalances])

  // 🔑 Initial load: Trigger balance fetch when user logs in
  useEffect(() => {
    if (user?.id && !hasFetchedInitialRef.current) {
      console.log('� [BalanceContext] INITIAL LOAD - Fetching balance with forceRefresh=TRUE')
      hasFetchedInitialRef.current = true // Marca como fetched ANTES da chamada async
      // ⚡ CRITICAL: Use forceRefresh=TRUE on initial load to skip local cache
      // This prevents showing stale cached data that gets replaced seconds later
      fetchBalances(true, false, false, false) // forceRefresh=TRUE (bypassa cache local), emitEvent=false, silent=false, useSummary=FALSE
    } else if (!user?.id) {
      // Se não há usuário, garante que loading seja false para não travar a UI
      hasFetchedInitialRef.current = false // Reset quando não há user
      setLoading(false)
    }
  }, [user?.id, fetchBalances])

  // Auto-refresh a cada 5 minutos de forma silenciosa com dados COMPLETOS
  // IMPORTANTE: Só inicia APÓS os primeiros 5 minutos, não imediatamente
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    // Aguarda 5 minutos antes de iniciar o auto-refresh
    const timeout = setTimeout(() => {
      // Primeira chamada após 5 minutos
      fetchBalances(true, false, true, false) // forceRefresh=true, silent=true, useSummary=FALSE
      
      // Depois configura o intervalo de 5 em 5 minutos
      interval = setInterval(() => {
        fetchBalances(true, false, true, false) // forceRefresh=true, silent=true, useSummary=FALSE
      }, 5 * 60 * 1000) // 5 minutos
    }, 5 * 60 * 1000) // Primeiro timeout de 5 minutos

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [fetchBalances])

  // Listener para eventos externos (como exchanges-manager)
  useEffect(() => {
    const handleBalancesUpdate = () => {
      setTimeout(() => fetchBalances(true, false, true, false), 100) // useSummary=FALSE
    }
    
    // Adiciona listener ao Set
    listeners.add(handleBalancesUpdate)
    
    return () => {
      // Remove listener na limpeza
      listeners.delete(handleBalancesUpdate)
    }
  }, [fetchBalances])

  // Lazy load: Busca detalhes de UMA exchange específica
  const fetchExchangeDetails = useCallback(async (exchangeId: string) => {
    try {
      if (!user?.id) {
        console.warn('⚠️ No user ID available')
        return null
      }
      
      const details = await apiService.getExchangeDetails(user.id, exchangeId, true)
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
