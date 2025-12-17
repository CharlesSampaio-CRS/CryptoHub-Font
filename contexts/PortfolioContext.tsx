import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { apiService } from '@/services/api'
import { config } from '@/lib/config'
import { PortfolioEvolutionResponse } from '@/types/api'

interface PortfolioContextType {
  evolutionData: PortfolioEvolutionResponse | null
  loading: boolean
  error: string | null
  refreshEvolution: () => Promise<void>
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [evolutionData, setEvolutionData] = useState<PortfolioEvolutionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvolutionData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      
      const startTime = Date.now()
      
      const data = await apiService.getPortfolioEvolution(config.userId, 7)
      
      const duration = Date.now() - startTime
      console.log(`✅ PortfolioContext: Evolution carregado em ${duration}ms`)
      
      setEvolutionData(data)
    } catch (err: any) {
      console.error('❌ Error loading evolution data:', err)
      setError(err.message || 'Failed to load evolution data')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadEvolutionData()
  }, [loadEvolutionData])

  const refreshEvolution = useCallback(async () => {
    await loadEvolutionData()
  }, [loadEvolutionData])

  const value = useMemo(() => ({
    evolutionData,
    loading,
    error,
    refreshEvolution
  }), [evolutionData, loading, error, refreshEvolution])

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
