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
  fetchBalances: (forceRefresh?: boolean, emitEvent?: boolean, silent?: boolean) => Promise<void>
  refresh: () => Promise<void>
  refreshOnExchangeChange: () => Promise<void>
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBalances = useCallback(async (forceRefresh = false, emitEvent = false, silent = false) => {
    try {
      // Controle inteligente de loading states
      if (!silent && !data) {
        setLoading(true)
      } else if (!silent && forceRefresh) {
        setRefreshing(true)
      }
      setError(null)
      
      // Se forceRefresh é true, força busca sem cache (cache: false no backend)
      const response = await apiService.getBalances(config.userId, forceRefresh)
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
    // Atualiza com cache: false, de forma silenciosa, e emite evento
    await fetchBalances(true, true, true)
  }, [fetchBalances])

  // Fetch inicial (com cache)
  useEffect(() => {
    fetchBalances(false) // Primeira carga usa cache se disponível
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

  const value = useMemo(() => ({
    data,
    loading,
    error,
    refreshing,
    fetchBalances,
    refresh,
    refreshOnExchangeChange
  }), [data, loading, error, refreshing, fetchBalances, refresh, refreshOnExchangeChange])

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
