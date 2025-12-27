import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import { useState, useCallback, useMemo, memo, useRef, useEffect } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { apiService } from "@/services/api"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { SkeletonExchangeItem } from "./SkeletonLoaders"
import { TokenDetailsModal } from "./token-details-modal"
import { TradeModal } from "./trade-modal"
import { ordersCache } from "./open-orders-modal"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"
import { config } from "@/lib/config"
import { getExchangeLogo } from "@/lib/exchange-logos"
import { typography, fontWeights } from "@/lib/typography"
import { useTokenMonitor } from "@/hooks/use-token-monitor"
import { useOpenOrdersSync } from "@/hooks/useOpenOrdersSync"

// Lista de stablecoins e moedas fiat que não devem ter variação e botão de trade
const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD', 'USDD', 'BRL', 'EUR', 'USD']

interface ExchangesListProps {
  onAddExchange?: () => void
  onOpenOrdersPress?: (exchangeId: string, exchangeName: string) => void
  onRefreshOrders?: () => void  // Callback para atualizar ordens
}

export const ExchangesList = memo(function ExchangesList({ onAddExchange, onOpenOrdersPress, onRefreshOrders }: ExchangesListProps) {
  const { colors, isDark } = useTheme()
  const { t } = useLanguage()
  const { data, loading, error, refresh: refreshBalance } = useBalance()
  const { hideValue } = usePrivacy()
  // Removido: expandedExchanges state - não precisa mais expandir (UX improvement)
  const [hideZeroBalanceExchanges, setHideZeroBalanceExchanges] = useState(true)
  const [selectedToken, setSelectedToken] = useState<{ exchangeId: string; symbol: string } | null>(null)
  const [tokenModalVisible, setTokenModalVisible] = useState(false)
  const [tradeModalVisible, setTradeModalVisible] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<{
    exchangeId: string
    exchangeName: string
    symbol: string
    currentPrice: number
    balance: { token: number; usdt: number }
  } | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null)
  const [openOrdersCount, setOpenOrdersCount] = useState<Record<string, number>>({})
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingOrdersByExchange, setLoadingOrdersByExchange] = useState<Record<string, boolean>>({})
  const [hasLoadedOrders, setHasLoadedOrders] = useState(false)
  const [lastOrdersUpdate, setLastOrdersUpdate] = useState<Date | null>(null)
  const ordersIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Estados para variações de preço
  const [exchangeVariations, setExchangeVariations] = useState<Record<string, Record<string, any>>>({})
  const [loadingVariations, setLoadingVariations] = useState<Record<string, boolean>>({})
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<string, Date>>({})
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  // 📊 Monitor tokens for price alerts
  const monitoredTokens = useMemo(() => {
    const tokens: Array<{ symbol: string; exchange: string; variation24h: number; price: number }> = []
    
    if (data?.exchanges) {
      console.log('🔍 [ExchangesList] Exchanges disponíveis:', data.exchanges.map((ex: any) => ({
        name: ex.name,
        exchange_id: ex.exchange_id,
        tokens_count: ex.tokens ? Object.keys(ex.tokens).length : 0
      })))
      
      data.exchanges.forEach((exchange: any) => {
        // ✅ tokens é um Record/Object, não array
        if (exchange.tokens && typeof exchange.tokens === 'object') {
          Object.entries(exchange.tokens).forEach(([symbol, tokenData]: [string, any]) => {
            // ✅ Acesso correto: exchangeVariations[exchangeId][symbol]
            const tokenVariations = exchangeVariations[exchange.exchange_id]?.[symbol]
            
            if (tokenVariations?.['24h']?.price_change_percent !== undefined) {
              tokens.push({
                symbol: symbol,
                exchange: exchange.exchange_id,
                variation24h: parseFloat(tokenVariations['24h'].price_change_percent), // ✅ Converte string para número
                price: parseFloat(tokenData.price_usd) || 0
              })
            }
          })
        }
      })
    }
    
    console.log('🔄 [ExchangesList] monitoredTokens atualizado:', tokens.length, 'tokens', tokens)
    return tokens
  }, [data?.exchanges, exchangeVariations])

  // Activate token monitoring
  useTokenMonitor(monitoredTokens)

  // 🔄 AUTO-SYNC: Sincroniza open orders automaticamente quando tokens mudarem
  const { syncOpenOrders: manualSyncOrders, isSyncing: isSyncingOrders } = useOpenOrdersSync({
    userId: config.userId,
    enabled: true, // Sempre habilitado
    onSyncStart: () => {
      console.log('🔄 [ExchangesList] Open orders sync started...')
      setLoadingOrders(true)
    },
    onSyncComplete: (results) => {
      console.log('✅ [ExchangesList] Open orders sync completed:', results)
      
      // Atualiza contagem de ordens por exchange
      const newCounts: Record<string, number> = {}
      results.forEach((result) => {
        if (result.success) {
          newCounts[result.exchangeId] = result.ordersCount
        }
      })
      
      setOpenOrdersCount(newCounts)
      setLoadingOrders(false)
      setHasLoadedOrders(true)
      setLastOrdersUpdate(new Date())
      
      // Notifica parent se houver callback
      if (onRefreshOrders) {
        onRefreshOrders()
      }
    },
    onSyncError: (error) => {
      console.error('❌ [ExchangesList] Open orders sync error:', error)
      setLoadingOrders(false)
    }
  })

  // ⚡ Busca contagem de ordens abertas logo após carregar as exchanges (prioridade alta)
  useEffect(() => {
    // Só executa quando: dados prontos + não loading + não buscou ainda
    if (!loading && data?.exchanges && data.exchanges.length > 0 && !hasLoadedOrders && !loadingOrders) {
      // Delay mínimo para garantir render da lista
      const timer = setTimeout(() => {
        fetchOpenOrdersCount()
      }, 200) // Reduzido de 500ms para 200ms

      return () => clearTimeout(timer)
    }
  }, [loading, data?.exchanges, hasLoadedOrders, loadingOrders])

  // ⏰ Atualização automática a cada 5 minutos
  useEffect(() => {
    if (hasLoadedOrders && data?.exchanges && data.exchanges.length > 0) {
      // Limpa interval anterior se existir
      if (ordersIntervalRef.current) {
        clearInterval(ordersIntervalRef.current)
      }

      // Configura novo interval de 5 minutos (300000ms)
      ordersIntervalRef.current = setInterval(() => {
        fetchOpenOrdersCount()
      }, 5 * 60 * 1000) // 5 minutos

      return () => {
        if (ordersIntervalRef.current) {
          clearInterval(ordersIntervalRef.current)
          ordersIntervalRef.current = null
        }
      }
    }
  }, [hasLoadedOrders, data?.exchanges])

  // Busca as ordens abertas para UMA exchange específica (atualização rápida após criar/cancelar ordem)
  const fetchOpenOrdersForExchange = useCallback(async (exchangeId: string) => {
    console.log('⚡ [ExchangesList] Atualizando ordens da exchange:', exchangeId)
    
    try {
      const response = await apiService.getOpenOrders(config.userId, exchangeId)
      const count = response.count || response.total_orders || 0
      const orders = response.orders || []
      
      // Salva as ordens completas no cache
      const cacheKey = `${config.userId}_${exchangeId}`
      ordersCache.set(cacheKey, { 
        orders: orders, 
        timestamp: Date.now()
      })
      
      // Atualiza contagem no estado
      setOpenOrdersCount(prev => ({
        ...prev,
        [exchangeId]: count
      }))
      
      console.log(`✅ [ExchangesList] Exchange ${exchangeId} atualizada: ${count} ordens`)
      return { success: true, count, orders }
    } catch (error: any) {
      console.error('❌ [ExchangesList] Erro ao atualizar ordens de', exchangeId, ':', error.message)
      return { success: false, count: 0 }
    }
  }, [])

  const fetchOpenOrdersCount = useCallback(async () => {
    if (!data?.exchanges || data.exchanges.length === 0) {
      return
    }

    // Evita múltiplas chamadas simultâneas
    if (loadingOrders) {
      console.log('⚠️ [ExchangesList] Já está carregando ordens, ignorando...')
      return
    }

    setLoadingOrders(true)
    console.log('🔄 [ExchangesList] Iniciando busca PARALELA de ordens para', data.exchanges.length, 'exchanges')
    
    const startTime = Date.now()
    let successCount = 0
    let failCount = 0
    let totalOrders = 0
    
    // 🚀 Busca em lotes de 3 exchanges por vez (paralelo controlado)
    const BATCH_SIZE = 3
    
    for (let i = 0; i < data.exchanges.length; i += BATCH_SIZE) {
      const batch = data.exchanges.slice(i, i + BATCH_SIZE)
      
      console.log(`📦 [ExchangesList] Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.exchanges.length / BATCH_SIZE)}`)
      
      // Cria promises para todas as exchanges do lote
      const batchPromises = batch.map(async (exchange) => {
        try {
          console.log('📡 [ExchangesList] Buscando ordens de:', exchange.name)
          const response = await apiService.getOpenOrders(config.userId, exchange.exchange_id)
          const count = response.count || response.total_orders || 0
          const orders = response.orders || []
          
          // Salva as ordens completas no cache para uso posterior no modal
          const cacheKey = `${config.userId}_${exchange.exchange_id}`
          const updateTime = Date.now()
          ordersCache.set(cacheKey, { 
            orders: orders, 
            timestamp: updateTime 
          })
          console.log('💾 [ExchangesList] Cache atualizado para', exchange.name, '-', orders.length, 'ordens')
          
          return { 
            success: true, 
            exchangeId: exchange.exchange_id,
            exchangeName: exchange.name,
            count, 
            orders 
          }
        } catch (error: any) {
          console.error('❌ [ExchangesList] Erro ao buscar ordens de', exchange.name, ':', error.message)
          return { 
            success: false, 
            exchangeId: exchange.exchange_id,
            exchangeName: exchange.name,
            count: 0 
          }
        }
      })
      
      // Aguarda todas as promises do lote completarem (mesmo se algumas falharem)
      const batchResults = await Promise.allSettled(batchPromises)
      
      // Processa resultados do lote
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const data = result.value
          
          // Atualiza contagem no estado
          setOpenOrdersCount(prev => ({
            ...prev,
            [data.exchangeId]: data.count
          }))
          
          if (data.success) {
            successCount++
            totalOrders += data.count
            console.log('✅ [ExchangesList]', data.exchangeName, ':', data.count, 'ordens')
          } else {
            failCount++
          }
        } else {
          failCount++
          console.error('❌ [ExchangesList] Promise rejeitada:', result.reason)
        }
      })
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('📊 [ExchangesList] Busca concluída em', elapsed, 's - Resumo:', {
      sucesso: successCount,
      falha: failCount,
      totalOrdens: totalOrders
    })
    
    // Atualiza timestamp da última atualização
    setLastOrdersUpdate(new Date())
    setLoadingOrders(false)
    setHasLoadedOrders(true)
  }, [data?.exchanges, loadingOrders])

  // Função para atualizar ordens de uma exchange específica (usada após cancelar ordem)
  const refreshSingleExchangeOrders = useCallback(async (exchangeId: string) => {
    const exchange = data?.exchanges?.find((ex: any) => ex.exchange_id === exchangeId)
    if (!exchange) return

    console.log('🔄 [ExchangesList] Atualizando ordens de:', exchange.name)
    
    // Marca como loading para esta exchange
    setLoadingOrdersByExchange(prev => ({ ...prev, [exchangeId]: true }))

    try {
      const response = await apiService.getOpenOrders(config.userId, exchangeId)
      const count = response.count || response.total_orders || 0
      const orders = response.orders || []
      
      // Atualiza cache
      const cacheKey = `${config.userId}_${exchangeId}`
      ordersCache.set(cacheKey, { 
        orders: orders, 
        timestamp: Date.now() 
      })
      
      // Atualiza contagem
      setOpenOrdersCount(prev => ({
        ...prev,
        [exchangeId]: count
      }))
      
      console.log('✅ [ExchangesList] Ordens atualizadas:', exchange.name, '-', count, 'ordens')
    } catch (error: any) {
      console.error('❌ [ExchangesList] Erro ao atualizar ordens:', error.message)
    } finally {
      // Remove loading
      setLoadingOrdersByExchange(prev => ({ ...prev, [exchangeId]: false }))
    }
  }, [data?.exchanges])

  // Busca variações de preço para uma exchange específica
  const fetchExchangeVariations = useCallback(async (exchangeId: string) => {
    const exchange = data?.exchanges?.find((ex: any) => ex.exchange_id === exchangeId)
    
    if (!exchange || !exchange.tokens) {
      return
    }

    // Cancela requisição anterior se existir
    if (abortControllersRef.current.has(exchangeId)) {
      abortControllersRef.current.get(exchangeId)?.abort()
    }

    // Cria novo AbortController para esta requisição
    const abortController = new AbortController()
    abortControllersRef.current.set(exchangeId, abortController)

    setLoadingVariations(prev => ({ ...prev, [exchangeId]: true }))

    try {
      const tokenSymbols = Object.keys(exchange.tokens)
      
      // Lista de tokens que NÃO precisam de consulta (stablecoins e moedas fiat)
      const EXCLUDED_TOKENS = ['USDT', 'BRL', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD', 'EUR', 'USDD']
      
      // Filtra e ordena tokens por valor (maiores primeiro)
      const tokensWithValue = tokenSymbols
        .filter(symbol => !EXCLUDED_TOKENS.includes(symbol.toUpperCase()))
        .map(symbol => ({
          symbol,
          value: parseFloat((exchange.tokens[symbol] as any)?.value_usd || '0')
        }))
        .sort((a, b) => b.value - a.value)
      
      const tokensToFetch = tokensWithValue.map(t => t.symbol)
      
      // Se não houver tokens para buscar, apenas marca como concluído
      if (tokensToFetch.length === 0) {
        setExchangeVariations(prev => ({ ...prev, [exchangeId]: {} }))
        setLastUpdateTime(prev => ({ ...prev, [exchangeId]: new Date() }))
        setLoadingVariations(prev => ({ ...prev, [exchangeId]: false }))
        return
      }
      
      // Limita a 10 tokens mais valiosos
      const tokensLimited = tokensToFetch.slice(0, 10)
      
      // Busca em lotes de 3 tokens por vez
      const BATCH_SIZE = 3
      const variationsMap: Record<string, any> = {}
      
      for (let i = 0; i < tokensLimited.length; i += BATCH_SIZE) {
        // Verifica se foi cancelado
        if (abortController.signal.aborted) {
          return
        }

        const batch = tokensLimited.slice(i, i + BATCH_SIZE)
        
        const batchPromises = batch.map(symbol =>
          apiService.getTokenDetails(exchangeId, symbol, config.userId)
            .catch(error => {
              // Ignora erros de timeout para não bloquear os outros
              return null
            })
        )
        
        const batchResults = await Promise.all(batchPromises)
        
        // Processa resultados do lote
        batchResults.forEach((tokenData, index) => {
          if (tokenData && tokenData.change) {
            const symbol = batch[index]
            variationsMap[symbol] = tokenData.change
          }
        })

        // Atualiza parcialmente a cada lote (feedback visual progressivo)
        if (Object.keys(variationsMap).length > 0) {
          setExchangeVariations(prev => ({ 
            ...prev, 
            [exchangeId]: { ...prev[exchangeId], ...variationsMap }
          }))
        }
      }
      
      setLastUpdateTime(prev => ({ ...prev, [exchangeId]: new Date() }))
    } catch (error: any) {
      console.error('Erro ao buscar variações:', error)
    } finally {
      setLoadingVariations(prev => ({ ...prev, [exchangeId]: false }))
      abortControllersRef.current.delete(exchangeId)
    }
  }, [data?.exchanges])

  // Busca variações automaticamente quando os dados estão prontos
  useEffect(() => {
    if (!loading && data?.exchanges && data.exchanges.length > 0) {
      // Aguarda um pouco para não sobrecarregar
      const timer = setTimeout(() => {
        data.exchanges.forEach(exchange => {
          fetchExchangeVariations(exchange.exchange_id)
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [loading, data?.exchanges, fetchExchangeVariations])

  // Expõe função de atualizar ordens através de callback e window global
  useEffect(() => {
    // Expõe globalmente - TODAS as exchanges
    (window as any).__exchangesListRefreshOrders = fetchOpenOrdersCount
    
    // Também chama o callback se existir (para atualizar o ref no HomeScreen)
    if (onRefreshOrders) {
      onRefreshOrders()
    }
  }, [fetchOpenOrdersCount, onRefreshOrders])

  // Expõe função de atualizar uma exchange específica globalmente
  useEffect(() => {
    (window as any).__exchangesListRefreshOrdersForExchange = refreshSingleExchangeOrders
  }, [refreshSingleExchangeOrders])

  const toggleZeroBalanceExchanges = useCallback(() => {
    setHideZeroBalanceExchanges(prev => !prev)
  }, [])

  const handleTokenPress = useCallback((exchangeId: string, symbol: string) => {
    setSelectedToken({ exchangeId, symbol })
    setTokenModalVisible(true)
  }, [])

  const handleCloseTokenModal = useCallback(() => {
    setTokenModalVisible(false)
    setTimeout(() => {
      setSelectedToken(null)
    }, 300)
  }, [])

  // Filtrar exchanges - oculta corretoras com saldo $0 se toggle ativado
  const filteredExchanges = useMemo(() => {
    if (!data) {
      return []
    }
    
    if (!data.exchanges || data.exchanges.length === 0) {
      return []
    }
    
    // Filtra corretoras com saldo $0 se toggle ativado
    const filtered = hideZeroBalanceExchanges
      ? data.exchanges.filter(ex => parseFloat(ex.total_usd || '0') > 0)
      : data.exchanges
    return filtered
  }, [data, data?.timestamp, hideZeroBalanceExchanges])

  // Estilos dinâmicos baseados no tema
  const themedStyles = useMemo(() => ({
    card: { backgroundColor: colors.surface, borderColor: colors.border },
    toggle: { 
      backgroundColor: isDark ? 'rgba(60, 60, 60, 0.4)' : 'rgba(220, 220, 220, 0.5)', 
      borderColor: isDark ? 'rgba(80, 80, 80, 0.3)' : 'rgba(200, 200, 200, 0.4)' 
    },
    toggleActive: { 
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)', 
      borderColor: isDark ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.7)' 
    },
    toggleThumb: { 
      backgroundColor: isDark ? 'rgba(140, 140, 140, 0.9)' : 'rgba(120, 120, 120, 0.85)' 
    },
    toggleThumbActive: { 
      backgroundColor: isDark ? 'rgba(96, 165, 250, 1)' : 'rgba(59, 130, 246, 1)' 
    },
    tokensContainer: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    logoContainer: { backgroundColor: '#ffffff', borderColor: colors.border }, // Fundo branco em ambos os modos para os ícones
  }), [colors, isDark])

  // Cores do gradiente para os cards - tons neutros
  const cardGradientColors: readonly [string, string, ...string[]] = isDark 
    ? ['rgba(26, 26, 26, 0.95)', 'rgba(38, 38, 38, 0.95)', 'rgba(26, 26, 26, 0.95)']  // Dark mode - preto/cinza escuro
    : ['rgba(250, 250, 250, 1)', 'rgba(252, 252, 252, 1)', 'rgba(250, 250, 250, 1)']  // Light mode - cinza claríssimo quase branco

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonExchangeItem />
        <SkeletonExchangeItem />
        <SkeletonExchangeItem />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error || t('home.noData')}</Text>
      </View>
    )
  }
  
  return (
    <View style={styles.container}>
      {/* Toggle de Filtro */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.toggleRow}
          onPress={toggleZeroBalanceExchanges}
          activeOpacity={0.7}
        >
          <View style={styles.toggleLabelContainer}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
              {t('exchanges.hideZeroExchanges')}
            </Text>
            {hideZeroBalanceExchanges && data && data.exchanges.length > filteredExchanges.length && (
              <Text style={[styles.hiddenCount, { color: colors.textSecondary }]}>
                ({data.exchanges.length - filteredExchanges.length} {t('exchanges.hidden')})
              </Text>
            )}
          </View>
          <View style={[styles.toggle, themedStyles.toggle, hideZeroBalanceExchanges && [styles.toggleActive, themedStyles.toggleActive]]}>
            <View style={[
              styles.toggleThumb, 
              themedStyles.toggleThumb, 
              hideZeroBalanceExchanges && styles.toggleThumbActive,
              hideZeroBalanceExchanges && themedStyles.toggleThumbActive
            ]} />
          </View>
        </TouchableOpacity>

        {/* 🔄 Sync Status Indicator - mostra quando estiver sincronizando ordens */}
        {(isSyncingOrders || loadingOrders) && (
          <View style={styles.syncIndicator}>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.syncText, { color: colors.textSecondary }]}>
              Sincronizando ordens...
            </Text>
          </View>
        )}
        
        {/* ✅ Last Sync Time - mostra quando foi a última sincronização */}
        {!isSyncingOrders && !loadingOrders && lastOrdersUpdate && (
          <View style={styles.lastSyncContainer}>
            <Text style={[styles.lastSyncText, { color: colors.textTertiary }]}>
              Última atualização: {lastOrdersUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.list} collapsable={false}>
        {filteredExchanges.map((exchange, index) => {
          const allTokens = Object.entries(exchange.tokens || {}) as [string, any][]
          
          // Mostra todos os tokens da corretora
          let tokens = allTokens
          
          // Lista de stablecoins e moedas fiat
          const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD', 'USDD', 'BRL', 'EUR', 'USD']
          
          // Ordenar tokens: stablecoins por último, depois por variação, depois por valor
          tokens = tokens.sort((a, b) => {
            const [symbolA, tokenA] = a
            const [symbolB, tokenB] = b
            
            // Verifica se é stablecoin
            const isStablecoinA = STABLECOINS.includes(symbolA.toUpperCase())
            const isStablecoinB = STABLECOINS.includes(symbolB.toUpperCase())
            
            // Stablecoins vão para o final
            if (isStablecoinA && !isStablecoinB) return 1
            if (!isStablecoinA && isStablecoinB) return -1
            
            // Ordenar por valor (maior primeiro)
            const valueA = parseFloat(tokenA.value_usd)
            const valueB = parseFloat(tokenB.value_usd)
            return valueB - valueA
          })
          
          // Usar token_count do summary se disponível, caso contrário contar os tokens carregados
          const tokenCount = exchange.token_count !== undefined ? exchange.token_count : tokens.length
          const balance = parseFloat(exchange.total_usd)
          const logoSource = getExchangeLogo(exchange.name)

          return (
            <View key={exchange.exchange_id} style={index !== filteredExchanges.length - 1 && styles.cardMargin}>
              {/* Header da Exchange - Mesmo estilo dos tokens */}
              <View
                style={[
                  styles.tokenItemCompact,
                  { 
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                  }
                ]}
              >
                <View style={styles.tokenCompactRow}>
                  {/* Logo da Exchange */}
                  <View style={[styles.logoContainer, themedStyles.logoContainer]}>
                    {logoSource ? (
                      <Image 
                        source={logoSource} 
                        style={styles.logoImage}
                        resizeMode="contain"
                        fadeDuration={0}
                        defaultSource={logoSource}
                      />
                    ) : (
                      <Text style={styles.logoFallback}>💰</Text>
                    )}
                  </View>
                  
                  {/* Nome da Exchange */}
                  <Text style={[styles.tokenSymbolCompact, { color: colors.text }]} numberOfLines={1}>
                    {exchange.name}
                  </Text>
                  
                  {/* Quantidade de assets */}
                  <Text style={[styles.tokenAmountCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                    {tokenCount} {tokenCount === 1 ? 'asset' : 'assets'}
                  </Text>
                  
                  {/* Saldo Total */}
                  <Text style={[styles.tokenValueCompact, { color: colors.text }]} numberOfLines={1}>
                    {hideValue(`$${apiService.formatUSD(balance)}`)}
                  </Text>
                  
                  {/* Badge de ordens abertas */}
                  {(() => {
                    const count = openOrdersCount[exchange.exchange_id]
                    const isLoadingThisExchange = loadingOrdersByExchange[exchange.exchange_id]
                    const hasCallback = !!onOpenOrdersPress
                    return (count > 0 || isLoadingThisExchange) && hasCallback ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation()
                          if (!isLoadingThisExchange) {
                            onOpenOrdersPress(exchange.exchange_id, exchange.name)
                          }
                        }}
                        style={[
                          styles.variationBadgeCompact,
                          { 
                            backgroundColor: isLoadingThisExchange ? 'transparent' : colors.primary + '15',
                            borderWidth: isLoadingThisExchange ? 0 : 0.5,
                            borderColor: isLoadingThisExchange ? 'transparent' : colors.primary,
                            marginLeft: 8,
                          }
                        ]}
                        disabled={isLoadingThisExchange}
                      >
                        {isLoadingThisExchange ? (
                          <AnimatedLogoIcon size={12} />
                        ) : (
                          <Text style={[styles.variationTextCompact, { color: colors.primary }]}>
                            {t('orders.badge').toLowerCase()}: {count}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : null
                  })()}
                </View>
              </View>

              {/* Lista de Tokens */}
              <View
                  style={[
                    styles.tokensContainer,
                    { 
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }
                  ]}
                >
                  {tokens.length === 0 ? (
                    <Text style={[styles.noTokensText, { color: colors.textSecondary }]}>{t('home.noData')}</Text>
                  ) : (
                    <>
                      {tokens.slice(0, 10).map(([symbol, token], tokenIndex) => {
                      const valueUSD = parseFloat(token.value_usd)
                      const priceUSD = parseFloat(token.price_usd)
                      
                      // Saldo USDT na exchange (precisa buscar do token USDT)
                      const usdtToken = tokens.find(([sym]) => sym === 'USDT')
                      const usdtBalance = usdtToken ? parseFloat(usdtToken[1].amount) : 0
                      
                      // Verifica se o token está disponível para trade
                      const tokenBalance = parseFloat(token.amount)
                      const isAvailableForTrade = usdtBalance > 0 || tokenBalance > 0
                      
                      // Busca variações do mapa de variações
                      const tokenVariations = exchangeVariations[exchange.exchange_id]?.[symbol]
                      
                      // Verifica se é stablecoin
                      const isStablecoin = STABLECOINS.includes(symbol.toUpperCase())
                      
                      // Pega apenas a variação de 24h (ou 0 para stablecoins)
                      const variation24h = isStablecoin ? 0 : tokenVariations?.['24h']?.price_change_percent
                      
                      return (
                        <View
                          key={symbol}
                          style={[
                            styles.tokenItemCompact,
                            { 
                              backgroundColor: colors.surface,
                              borderBottomColor: colors.border,
                              zIndex: 1000 - tokenIndex,
                              elevation: 1000 - tokenIndex,
                            }
                          ]}
                        >
                          {/* Linha única: Nome + Quantidade + Valor + Variação 24h + Trade */}
                          <View style={styles.tokenCompactRow}>
                            {/* TOKEN - clicável para abrir modal de detalhes com Tooltip de preço */}
                            <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <TouchableOpacity
                                onPress={() => handleTokenPress(exchange.exchange_id, symbol)}
                                onLongPress={() => setTooltipVisible(`price-${exchange.exchange_id}-${symbol}`)}
                                onPressOut={() => setTooltipVisible(null)}
                                delayLongPress={300}
                                activeOpacity={0.7}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                              >
                                {/* Indicador de disponibilidade */}
                                {isAvailableForTrade && (
                                  <View style={[styles.availabilityIndicator, { backgroundColor: '#10b981' }]} />
                                )}
                                <Text style={[styles.tokenSymbolCompact, { color: colors.text }]} numberOfLines={1}>
                                  {symbol.toLowerCase()}
                                </Text>
                              </TouchableOpacity>
                              
                              {/* Tooltip de Preço */}
                              {tooltipVisible === `price-${exchange.exchange_id}-${symbol}` && (
                                <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                  <Text style={[styles.tooltipText, { color: colors.text }]}>
                                    ${apiService.formatUSD(priceUSD)}
                                  </Text>
                                </View>
                              )}
                            </View>
                            
                            {/* Quantidade - não clicável */}
                            <Text style={[styles.tokenAmountCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                              {hideValue(apiService.formatTokenAmount(token.amount))}
                            </Text>
                            
                            {/* Valor USD - não clicável */}
                            <Text style={[styles.tokenValueCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                              {hideValue(`$${apiService.formatUSD(valueUSD)}`)}
                            </Text>
                            
                            {/* Variação 24h (sempre exibir, 0.00% para stablecoins) */}
                            <View
                              style={[
                                styles.variationBadgeCompact,
                                {
                                  backgroundColor: isStablecoin 
                                    ? colors.textSecondary + '15' 
                                    : (variation24h !== undefined && variation24h >= 0) 
                                      ? colors.success + '15' 
                                      : colors.danger + '15',
                                }
                              ]}
                            >
                              <Text
                                style={[
                                  styles.variationTextCompact,
                                  {
                                    color: isStablecoin 
                                      ? colors.textSecondary 
                                      : (variation24h !== undefined && variation24h >= 0) 
                                        ? colors.success 
                                        : colors.danger,
                                  }
                                ]}
                              >
                                {isStablecoin 
                                  ? '— 0.00%' 
                                  : variation24h !== undefined
                                    ? `${variation24h >= 0 ? '▲' : '▼'} ${Math.abs(variation24h).toFixed(2)}%`
                                    : '— 0.00%'
                                }
                              </Text>
                            </View>
                            
                            {/* Trade Button com Tooltip (desabilitado para stablecoins) */}
                            <View style={{ position: 'relative' }}>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation()
                                  if (!isStablecoin) {
                                    setSelectedTrade({
                                      exchangeId: exchange.exchange_id,
                                      exchangeName: exchange.name,
                                      symbol: symbol,
                                      currentPrice: priceUSD,
                                      balance: { token: parseFloat(token.amount), usdt: usdtBalance }
                                    })
                                    setTradeModalVisible(true)
                                  }
                                }}
                                onLongPress={() => !isStablecoin && setTooltipVisible(`${exchange.exchange_id}-${symbol}`)}
                                onPressOut={() => setTooltipVisible(null)}
                                delayLongPress={300}
                                disabled={isStablecoin}
                                style={[
                                  styles.ordersBadge, 
                                  { 
                                    backgroundColor: colors.surface, 
                                    borderColor: isDark ? 'rgba(80, 80, 80, 0.3)' : 'rgba(180, 180, 180, 0.2)',
                                    opacity: isStablecoin ? 0.3 : 1
                                  }
                                ]}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                                  <Text style={{ color: '#10b981', fontSize: 14, fontWeight: fontWeights.bold, lineHeight: 14, letterSpacing: -1 }}>↑</Text>
                                  <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: fontWeights.bold, lineHeight: 14, letterSpacing: -1 }}>↓</Text>
                                </View>
                              </TouchableOpacity>
                              
                              {/* Tooltip */}
                              {tooltipVisible === `${exchange.exchange_id}-${symbol}` && !isStablecoin && (
                                <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                  <Text style={[styles.tooltipText, { color: colors.text }]}>{t('trade.tooltip')}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      )
                    })}
                    
                    {/* Indicador "+X mais" se houver mais de 10 tokens */}
                    {tokens.length > 10 && (
                      <Text style={[styles.moreTokensText, { color: colors.textSecondary }]}>
                        +{tokens.length - 10} {t('exchanges.moreAssets')}
                      </Text>
                    )}
                    </>
                  )}
                </View>
            </View>
          )
        })}
      </View>

      {/* Modal de Detalhes do Token */}
      {selectedToken && (
        <TokenDetailsModal
          visible={tokenModalVisible}
          onClose={handleCloseTokenModal}
          exchangeId={selectedToken.exchangeId}
          symbol={selectedToken.symbol}
        />
      )}

      {/* Modal de Trade */}
      {selectedTrade && (
        <TradeModal
          visible={tradeModalVisible}
          onClose={() => setTradeModalVisible(false)}
          exchangeId={selectedTrade.exchangeId}
          exchangeName={selectedTrade.exchangeName}
          symbol={selectedTrade.symbol}
          currentPrice={selectedTrade.currentPrice}
          balance={selectedTrade.balance}
          onOrderCreated={async () => {
            // Atualiza APENAS a exchange da ordem criada
            console.log('🔄 [ExchangesList] Ordem criada, atualizando exchange:', selectedTrade.exchangeId)
            await fetchOpenOrdersForExchange(selectedTrade.exchangeId)
          }}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  filtersContainer: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 4,
    gap: 6,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  toggleLabelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: typography.caption,
    fontWeight: fontWeights.regular,
    opacity: 0.65,
  },
  hiddenCount: {
    fontSize: typography.micro,
    fontWeight: fontWeights.regular,
    fontStyle: "italic",
    opacity: 0.5,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleActive: {
    // Colors from theme
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  syncIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    opacity: 0.8,
  },
  syncText: {
    fontSize: typography.micro,
    fontWeight: fontWeights.regular,
  },
  lastSyncContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "flex-end",
  },
  lastSyncText: {
    fontSize: typography.micro - 1,
    fontWeight: fontWeights.light,
    fontStyle: "italic",
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 0,
  },
  cardMargin: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 3,
    borderWidth: 0,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    fontSize: typography.bodySmall,
  },
  exchangeName: {
    fontSize: typography.body,
    fontWeight: fontWeights.regular,
    marginBottom: 2,
    letterSpacing: 0,
  },
  exchangeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  ordersBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 0.5,
  },
  ordersBadgeText: {
    fontSize: typography.micro,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.3,
  },
  infoIconButton: {
    padding: 2,
    marginLeft: 4,
  },
  infoIconText: {
    fontSize: typography.h4,
  },
  assetsCount: {
    fontSize: typography.micro,
    fontWeight: fontWeights.light,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: typography.body,
    fontWeight: fontWeights.light,
    marginBottom: 2,
  },
  change: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.regular,
  },
  changePositive: {
  },
  changeNegative: {
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: typography.body,
    textAlign: "center",
    padding: 20,
  },
  tokensContainer: {
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 0,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    opacity: 0.8,
  },
  infoIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFA500",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconYellow: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.bold,
    color: "#FFFFFF",
  },
  infoText: {
    fontSize: typography.micro,
    fontWeight: fontWeights.light,
    flex: 1,
    lineHeight: 14,
  },
  tokensTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoButton: {
    padding: 4,
  },
  infoIcon: {
    fontSize: typography.body,
    opacity: 0.6,
  },
  lastUpdate: {
    fontSize: typography.micro,
    fontWeight: fontWeights.regular,
    marginBottom: 12,
    opacity: 0.5,
  },
  noTokensText: {
    fontSize: typography.caption,
    textAlign: "center",
    paddingVertical: 10,
  },
  moreTokensText: {
    fontSize: typography.caption,
    textAlign: "center",
    paddingVertical: 8,
    fontStyle: "italic",
  },
  tokenItem: {
    flexDirection: "column",
    gap: 6,
  },
  tokenTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenMiddleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenBottomLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tokenSymbolBadge: {
    borderRadius: 6,
    borderWidth: 1,
  },
  tokenSymbol: {
    letterSpacing: 0.5,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenAmount: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.regular,
  },
  tokenPriceSeparator: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.regular,
  },
  tokenPrice: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.regular,
  },
  tokenValue: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.medium,
  },
  tokenValueZero: {
    // Applied via inline style
  },
  tokenRight: {
    alignItems: "flex-end",
  },
  variationsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 4,
  },
  priceChangeContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  priceChangeText: {
    textAlign: "center",
  },
  // 🆕 Estilos compactos para layout horizontal simplificado
  tokenItemCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  tokenCompactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tokenSymbolCompact: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.2,
    minWidth: 48,
    textAlign: "left",
  },
  availabilityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tokenAmountCompact: {
    fontSize: typography.caption,
    fontWeight: fontWeights.regular,
    flex: 1,
    textAlign: "left",
  },
  tokenValueCompact: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
    minWidth: 60,
    textAlign: "right",
  },
  variationBadgeCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  variationTextCompact: {
    fontSize: typography.micro,
    fontWeight: fontWeights.bold,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  loadingTokens: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  loadingTokensText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.regular,
  },
  tooltip: {
    position: "absolute",
    bottom: -30,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.35,
    shadowRadius: 4.65,
    elevation: 999,
    zIndex: 9999,
  },
  tooltipText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
  },
})
