import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { apiService } from '@/services/api'
import { config } from '@/lib/config'
import { PortfolioEvolutionResponse } from '@/types/api'

interface PortfolioContextType {
  evolutionData: PortfolioEvolutionResponse | null
  loading: boolean
  error: string | null
  refreshEvolution: (days?: number) => Promise<void>
  currentPeriod: number
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [evolutionData, setEvolutionData] = useState<PortfolioEvolutionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState(7)

  const loadEvolutionData = useCallback(async (days: number, showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      
      console.log(`📊 PortfolioContext: Carregando evolution (days=${days}, showLoading=${showLoading})...`)
      const startTime = Date.now()
      
      const data = await apiService.getPortfolioEvolution(config.userId, days)
      
      const duration = Date.now() - startTime
      console.log(`✅ PortfolioContext: Evolution carregado em ${duration}ms`)
      
      setEvolutionData(data)
      setCurrentPeriod(days)
    } catch (err: any) {
      console.error('❌ Error loading evolution data:', err)
      const errorMessage = err.message && err.message.includes('fetch') 
        ? 'Erro ao consultar dados' 
        : err.message || 'Erro ao consultar dados'
      setError(errorMessage)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  // Load on mount DESABILITADO - será feito pelo DataLoader no App.tsx após login
  // useEffect(() => {
  //   loadEvolutionData(7)
  // }, [loadEvolutionData])

  // Refresh sem mostrar loading (usado no pull-to-refresh)
  const refreshEvolution = useCallback(async (days?: number, showLoadingState = true) => {
    const daysToUse = days !== undefined ? days : currentPeriod
    console.log(`🔄 PortfolioContext: Refresh evolution solicitado (days=${daysToUse}, showLoading=${showLoadingState})`)
    await loadEvolutionData(daysToUse, showLoadingState)
  }, [loadEvolutionData, currentPeriod])

  const value = useMemo(() => ({
    evolutionData,
    loading,
    error,
    refreshEvolution,
    currentPeriod
  }), [evolutionData, loading, error, refreshEvolution, currentPeriod])

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
}
