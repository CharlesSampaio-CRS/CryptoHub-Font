import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native"
import { useState, useCallback, useMemo, memo, useRef, useEffect } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { apiService } from "@/services/api"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { SkeletonExchangeItem } from "./SkeletonLoaders"
import { TokenDetailsModal } from "./token-details-modal"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"
import { config } from "@/lib/config"
import { getExchangeLogo } from "@/lib/exchange-logos"
import { typography, fontWeights } from "@/lib/typography"

interface ExchangesListProps {
  onAddExchange?: () => void
  availableExchangesCount?: number
  onOpenOrdersPress?: (exchangeId: string, exchangeName: string) => void
}

export const ExchangesList = memo(function ExchangesList({ onAddExchange, availableExchangesCount = 0, onOpenOrdersPress }: ExchangesListProps) {
  const { colors, isDark } = useTheme()
  const { t } = useLanguage()
  const { data, loading, error } = useBalance()
  const { hideValue } = usePrivacy()
  const [expandedExchanges, setExpandedExchanges] = useState<Set<string>>(new Set()) // Múltiplas exchanges expandidas
  const [hideZeroBalanceExchanges, setHideZeroBalanceExchanges] = useState(true) // ✅ Começa ATIVADO (oculta zeradas)
  const [selectedToken, setSelectedToken] = useState<{ exchangeId: string; symbol: string } | null>(null)
  const [tokenModalVisible, setTokenModalVisible] = useState(false)
  const [loadingVariations, setLoadingVariations] = useState<string | null>(null)
  const [exchangeVariations, setExchangeVariations] = useState<Record<string, Record<string, any>>>({})
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<string, Date>>({})
  const [openOrdersCount, setOpenOrdersCount] = useState<Record<string, number>>({})
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [hasLoadedOrders, setHasLoadedOrders] = useState(false)
  const [lastOrdersUpdate, setLastOrdersUpdate] = useState<Date | null>(null)
  const ordersIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fetchedExchangesRef = useRef<Set<string>>(new Set())
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  // Função otimizada para buscar variações de uma exchange
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

    try {
      const tokenSymbols = Object.keys(exchange.tokens)
      
      // Lista de tokens que NÃO precisam de consulta (stablecoins e moedas fiat)
      const EXCLUDED_TOKENS = ['USDT', 'BRL', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD', 'EUR', 'USDD']
      
      // Filtra e ordena tokens por valor (maiores primeiro)
      const tokensWithValue = tokenSymbols
        .filter(symbol => !EXCLUDED_TOKENS.includes(symbol.toUpperCase()))
        .map(symbol => ({
          symbol,
          value: (exchange.tokens[symbol] as any)?.total_value_usd || 0
        }))
        .sort((a, b) => b.value - a.value)
      
      const tokensToFetch = tokensWithValue.map(t => t.symbol)
      
      // Se não houver tokens para buscar, apenas marca como concluído
      if (tokensToFetch.length === 0) {
        setExchangeVariations(prev => ({ ...prev, [exchangeId]: {} }))
        setLastUpdateTime(prev => ({ ...prev, [exchangeId]: new Date() }))
        return
      }
      
      // Limita a 10 tokens mais valiosos se houver muitos
      const tokensLimited = tokensToFetch.slice(0, 10)
      
      // Busca em lotes de 3 tokens por vez (reduzido de 5 para evitar timeout)
      const BATCH_SIZE = 3
      const variationsMap: Record<string, any> = {}
      
      for (let i = 0; i < tokensLimited.length; i += BATCH_SIZE) {
        // Verifica se foi cancelado
        if (abortController.signal.aborted) {
          console.log(`Fetch cancelled for ${exchangeId}`)
          return
        }

        const batch = tokensLimited.slice(i, i + BATCH_SIZE)
        
        const batchPromises = batch.map(symbol =>
          apiService.getTokenDetails(exchangeId, symbol, config.userId)
            .catch(error => {
              // Ignora erros de timeout para não bloquear os outros
              if (!error.message.includes('aborted')) {
                console.error(`Error fetching ${symbol}:`, error.message)
              }
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
      if (error.name !== 'AbortError') {
        console.error(`Error fetching variations for ${exchangeId}:`, error)
      }
    } finally {
      abortControllersRef.current.delete(exchangeId)
    }
  }, [data])

  // Auto-refresh das variações a cada 2 minutos para TODAS as exchanges expandidas
  useEffect(() => {
    if (expandedExchanges.size === 0) return

    // Atualiza imediatamente as exchanges já buscadas
    expandedExchanges.forEach(exchangeId => {
      if (fetchedExchangesRef.current.has(exchangeId)) {
        fetchExchangeVariations(exchangeId)
      }
    })

    // Configura intervalo de 2 minutos
    const interval = setInterval(() => {
      expandedExchanges.forEach(exchangeId => {
        if (fetchedExchangesRef.current.has(exchangeId)) {
          fetchExchangeVariations(exchangeId)
        }
      })
    }, 2 * 60 * 1000) // 2 minutos

    return () => {
      clearInterval(interval)
      // Cancela todas as requisições pendentes ao desmontar
      abortControllersRef.current.forEach(controller => controller.abort())
      abortControllersRef.current.clear()
    }
  }, [expandedExchanges, fetchExchangeVariations])

  // Busca contagem de ordens abertas - OTIMIZADO para máxima velocidade
  useEffect(() => {
    // Só executa quando: dados prontos + não loading + não buscou ainda
    if (!loading && data?.exchanges && data.exchanges.length > 0 && !hasLoadedOrders && !loadingOrders) {
      console.log('📋 [OpenOrders] ⚡ Iniciando busca OTIMIZADA de ordens (delay 200ms)')
      
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
      console.log('📋 [OpenOrders] ⏰ Configurando atualização automática (5 minutos)')
      
      // Limpa interval anterior se existir
      if (ordersIntervalRef.current) {
        clearInterval(ordersIntervalRef.current)
      }

      // Configura novo interval de 5 minutos (300000ms)
      ordersIntervalRef.current = setInterval(() => {
        console.log('📋 [OpenOrders] 🔄 Atualização automática (5 minutos)')
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

  const fetchOpenOrdersCount = async () => {
    if (!data?.exchanges || data.exchanges.length === 0) {
      console.log('📋 [OpenOrders] ❌ Nenhuma exchange disponível')
      return
    }

    setLoadingOrders(true)
    console.log('📋 [OpenOrders] � Buscando ordens para', data.exchanges.length, 'exchanges EM PARALELO')
    console.log('📋 [OpenOrders] 📋 Exchanges:', data.exchanges.map((e: any) => e.name).join(', '))
    
    // ⚡ BUSCA EM PARALELO - Todas ao mesmo tempo!
    const promises = data.exchanges.map(async (exchange: any) => {
      try {
        console.log('📋 [OpenOrders] 🔍', exchange.name, '- Iniciando...')
        
        const response = await apiService.getOpenOrders(config.userId, exchange.exchange_id)
        const count = response.count || response.total_orders || 0
        
        console.log('📋 [OpenOrders] ✅', exchange.name, '→', count, 'ordens')
        
        // ⚡ Atualiza estado IMEDIATAMENTE para esta exchange
        setOpenOrdersCount(prev => ({
          ...prev,
          [exchange.exchange_id]: count
        }))
        
        return { exchangeId: exchange.exchange_id, count, success: true }
      } catch (error: any) {
        console.error('📋 [OpenOrders] ❌', exchange.name, '- Erro:', error?.message || error)
        
        // Define 0 mesmo com erro
        setOpenOrdersCount(prev => ({
          ...prev,
          [exchange.exchange_id]: 0
        }))
        
        return { exchangeId: exchange.exchange_id, count: 0, success: false, error }
      }
    })

    // Aguarda todas as requisições terminarem
    const results = await Promise.all(promises)
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const totalOrders = results.reduce((sum, r) => sum + r.count, 0)
    
    console.log('📋 [OpenOrders] 🎯 CONCLUÍDO!')
    console.log('📋 [OpenOrders] ✅ Sucesso:', successCount, '| ❌ Falha:', failCount)
    console.log('📋 [OpenOrders] 📊 Total de ordens:', totalOrders)
    console.log('📋 [OpenOrders] 📋 Exchanges com ordens:', 
      results
        .filter(r => r.count > 0)
        .map(r => {
          const ex = data.exchanges.find((e: any) => e.exchange_id === r.exchangeId)
          return `${ex?.name}: ${r.count}`
        })
        .join(', ') || 'Nenhuma'
    )
    
    // Atualiza timestamp da última atualização
    setLastOrdersUpdate(new Date())
    setLoadingOrders(false)
    setHasLoadedOrders(true)
  }

  // Toggle de expansão/colapso individual de exchanges
  const toggleExpandExchange = useCallback(async (exchangeId: string) => {
    const isCurrentlyExpanded = expandedExchanges.has(exchangeId)
    
    // Se está colapsando, cancela requisição pendente
    if (isCurrentlyExpanded) {
      const controller = abortControllersRef.current.get(exchangeId)
      if (controller) {
        controller.abort()
        abortControllersRef.current.delete(exchangeId)
      }
      setLoadingVariations(prev => prev === exchangeId ? null : prev)
    }
    
    setExpandedExchanges(prev => {
      const newSet = new Set(prev)
      if (isCurrentlyExpanded) {
        newSet.delete(exchangeId) // Remove = colapsa
      } else {
        newSet.add(exchangeId) // Adiciona = expande
      }
      return newSet
    })
    
    // Se está expandindo, verifica se precisa buscar variações
    if (!isCurrentlyExpanded) {
      const hasFetched = fetchedExchangesRef.current.has(exchangeId)
      const hasVariations = exchangeVariations[exchangeId]
      const lastUpdate = lastUpdateTime[exchangeId]
      
      // Só busca se:
      // 1. Nunca buscou antes OU
      // 2. Não tem variações em cache OU  
      // 3. Cache é muito antigo (> 5 minutos)
      const shouldFetch = !hasFetched || 
                         !hasVariations || 
                         !lastUpdate ||
                         (Date.now() - lastUpdate.getTime() > 5 * 60 * 1000)
      
      if (shouldFetch) {
        fetchedExchangesRef.current.add(exchangeId)
        
        // Busca variações em background sem bloquear a UI
        setLoadingVariations(exchangeId)
        fetchExchangeVariations(exchangeId)
          .catch(error => {
            console.error('Error loading price variations:', error)
          })
          .finally(() => {
            setLoadingVariations(null)
          })
      }
    }
  }, [expandedExchanges, fetchExchangeVariations, exchangeVariations, lastUpdateTime])

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
    toggle: { backgroundColor: colors.toggleInactive, borderColor: colors.toggleInactive },
    toggleActive: { backgroundColor: colors.toggleActive, borderColor: colors.toggleActive },
    toggleThumb: { backgroundColor: colors.toggleThumb },
    tokensContainer: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    logoContainer: { backgroundColor: '#ffffff', borderColor: colors.border }, // Fundo branco em ambos os modos para os ícones
  }), [colors])

  // Cores do gradiente para os cards - tons neutros
  const cardGradientColors: readonly [string, string, ...string[]] = isDark 
    ? ['rgba(26, 26, 26, 0.95)', 'rgba(38, 38, 38, 0.95)', 'rgba(26, 26, 26, 0.95)']  // Dark mode - preto/cinza escuro
    : ['rgba(250, 250, 250, 1)', 'rgba(252, 252, 252, 1)', 'rgba(250, 250, 250, 1)']  // Light mode - cinza claríssimo quase branco

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        <SkeletonExchangeItem />
        <SkeletonExchangeItem />
        <SkeletonExchangeItem />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error || t('home.noData')}</Text>
      </View>
    )
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        {availableExchangesCount > 0 && onAddExchange && (
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={onAddExchange}>
            <Text style={[styles.addButtonText, { color: colors.primary }]}>{t('exchanges.addButton')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info sobre variações */}
      <View style={[styles.infoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={styles.infoIconContainer}>
          <Text style={styles.infoIconYellow}>i</Text>
        </View>
        <Text style={[styles.infoText, { color: colors.text }]}>
          {t('portfolio.variationsNote')}
        </Text>
      </View>

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
            <View style={[styles.toggleThumb, themedStyles.toggleThumb, hideZeroBalanceExchanges && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
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
            
            // Se ambos são ou não são stablecoins, verificar variações
            const variationsA = exchangeVariations[exchange.exchange_id]?.[symbolA]
            const variationsB = exchangeVariations[exchange.exchange_id]?.[symbolB]
            
            // Verifica se tem alguma variação disponível
            const hasVariationA = variationsA && (
              variationsA['1h']?.price_change_percent !== undefined ||
              variationsA['4h']?.price_change_percent !== undefined ||
              variationsA['24h']?.price_change_percent !== undefined
            )
            const hasVariationB = variationsB && (
              variationsB['1h']?.price_change_percent !== undefined ||
              variationsB['4h']?.price_change_percent !== undefined ||
              variationsB['24h']?.price_change_percent !== undefined
            )
            
            // Tokens com variação vêm primeiro (mas só entre não-stablecoins)
            if (hasVariationA && !hasVariationB) return -1
            if (!hasVariationA && hasVariationB) return 1
            
            // Se ambos têm ou não têm variação, ordenar por valor
            const valueA = parseFloat(tokenA.value_usd)
            const valueB = parseFloat(tokenB.value_usd)
            return valueB - valueA
          })
          
          // Usar token_count do summary se disponível, caso contrário contar os tokens carregados
          const tokenCount = exchange.token_count !== undefined ? exchange.token_count : tokens.length
          const balance = parseFloat(exchange.total_usd)
          const logoSource = getExchangeLogo(exchange.name)
          
          // Verifica se esta exchange está no Set de expandidas
          const isExpanded = expandedExchanges.has(exchange.exchange_id)
          
          const isLoadingVariations = loadingVariations === exchange.exchange_id || loadingVariations === 'all'

          return (
            <View key={exchange.exchange_id} style={index !== filteredExchanges.length - 1 && styles.cardMargin}>
              <TouchableOpacity
                style={styles.cardWrapper}
                activeOpacity={0.7}
                onPress={() => toggleExpandExchange(exchange.exchange_id)}
              >
                <LinearGradient
                  colors={cardGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, { borderColor: colors.border }]}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.leftSection}>
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
                      <View style={{ flex: 1 }}>
                        <View style={styles.exchangeNameRow}>
                          <Text style={[styles.exchangeName, { color: colors.text }]}>{exchange.name}</Text>
                          
                          {/* Badge de ordens abertas */}
                          {(() => {
                            const count = openOrdersCount[exchange.exchange_id]
                            const hasCallback = !!onOpenOrdersPress
                            return count > 0 && hasCallback ? (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation()
                                  onOpenOrdersPress(exchange.exchange_id, exchange.name)
                                }}
                                style={[styles.ordersBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                              >
                                <Text style={[styles.ordersBadgeText, { color: colors.primary }]}>
                                  📊 {t('orders.badge')}: {count}
                                </Text>
                              </TouchableOpacity>
                            ) : null
                          })()}
                          
                          {(exchange as any).status === 'inactive' && (exchange as any).inactive_reason && (
                            <TouchableOpacity 
                              onPress={() => {
                                Alert.alert(
                                  `⚠️ ${t('alert.exchangeInactive')}`,
                                  (exchange as any).inactive_reason,
                                  [{ text: t('common.ok'), style: 'default' }]
                                )
                              }}
                              style={styles.infoIconButton}
                            >
                              <Text style={[styles.infoIconText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>ℹ️</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={[styles.assetsCount, { color: colors.textSecondary }]}>
                          {tokenCount} {tokenCount === 1 ? t('exchanges.asset') : t('exchanges.assets')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rightSection}>
                      <Text style={[styles.balance, { color: colors.text }]}>
                        {hideValue(apiService.formatUSD(balance))}
                      </Text>
                      <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {isExpanded && (
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
                  {isLoadingVariations && !lastUpdateTime[exchange.exchange_id] ? (
                    <View style={styles.loadingVariationsContainer}>
                      <AnimatedLogoIcon size={16} />
                      <Text style={[styles.lastUpdate, { color: colors.textSecondary, marginBottom: 0 }]}>
                        Carregando variações...
                      </Text>
                    </View>
                  ) : lastUpdateTime[exchange.exchange_id] ? (
                    <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
                      {t('portfolio.updatedAt')}: {lastUpdateTime[exchange.exchange_id].toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  ) : null}
                  {tokens.length === 0 ? (
                    <Text style={[styles.noTokensText, { color: colors.textSecondary }]}>{t('home.noData')}</Text>
                  ) : (
                    <>
                      {tokens.map(([symbol, token]) => {
                      const amount = parseFloat(token.amount)
                      const priceUSD = parseFloat(token.price_usd)
                      const valueUSD = parseFloat(token.value_usd)
                      
                      // Busca variações do mapa de variações carregado via API
                      const tokenVariations = exchangeVariations[exchange.exchange_id]?.[symbol]
                      
                      // Coleta TODAS as variações disponíveis (1h, 4h, 24h)
                      const variations: Array<{ value: number; label: string }> = []
                      
                      if (tokenVariations) {
                        if (tokenVariations['1h']?.price_change_percent !== undefined) {
                          variations.push({
                            value: parseFloat(tokenVariations['1h'].price_change_percent),
                            label: '1h'
                          })
                        }
                        if (tokenVariations['4h']?.price_change_percent !== undefined) {
                          variations.push({
                            value: parseFloat(tokenVariations['4h'].price_change_percent),
                            label: '4h'
                          })
                        }
                        if (tokenVariations['24h']?.price_change_percent !== undefined) {
                          variations.push({
                            value: parseFloat(tokenVariations['24h'].price_change_percent),
                            label: '24h'
                          })
                        }
                      }
                      
                      return (
                        <TouchableOpacity
                          key={symbol}
                          style={[
                            styles.tokenItem,
                            { 
                              backgroundColor: colors.surface,
                              borderBottomColor: colors.border,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 10,
                              marginBottom: 8,
                            }
                          ]}
                          onPress={() => handleTokenPress(exchange.exchange_id, symbol)}
                          activeOpacity={0.7}
                        >
                          {/* Linha 1: [TOKEN] Quantidade → Valor Total (direita) */}
                          <View style={styles.tokenTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              <View style={[
                                styles.tokenSymbolBadge,
                                { 
                                  backgroundColor: colors.primaryLight + '20',
                                  borderColor: colors.primary + '40',
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  marginRight: 8,
                                }
                              ]}>
                                <Text style={[styles.tokenSymbol, { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }]}>
                                  {symbol}
                                </Text>
                              </View>
                              <Text style={[styles.tokenAmount, { color: colors.textSecondary, fontSize: 12 }]}>
                                {hideValue(apiService.formatTokenAmount(token.amount))}
                              </Text>
                            </View>
                            <Text style={[styles.tokenValue, { color: colors.text, fontSize: 14, fontWeight: '600' }]}>
                              {hideValue(apiService.formatUSD(valueUSD))}
                            </Text>
                          </View>
                          
                          {/* Linha 2: Preço unitário → Variações (direita) */}
                          <View style={styles.tokenBottomRow}>
                            {priceUSD > 0 && (
                              <Text style={[styles.tokenPrice, { color: colors.textSecondary, fontSize: 11 }]}>
                                {hideValue(apiService.formatUSD(priceUSD))}
                              </Text>
                            )}
                            {variations.length > 0 && (
                              <View style={styles.variationsContainer}>
                                {variations.map((variation, idx) => {
                                  const isPositive = variation.value >= 0
                                  return (
                                    <View 
                                      key={variation.label}
                                      style={[
                                        styles.priceChangeContainer,
                                        { 
                                          backgroundColor: isPositive ? colors.success + '15' : colors.danger + '15',
                                          paddingHorizontal: 6,
                                          paddingVertical: 2,
                                          borderRadius: 4,
                                          marginLeft: idx === 0 ? 0 : 4,
                                        }
                                      ]}
                                    >
                                      <Text style={[
                                        styles.priceChangeText,
                                        { 
                                          color: isPositive ? colors.success : colors.danger,
                                          fontSize: 10,
                                          fontWeight: '600',
                                        }
                                      ]}>
                                        {isPositive ? '▲' : '▼'} {Math.abs(variation.value).toFixed(2)}% {variation.label}
                                      </Text>
                                    </View>
                                  )
                                })}
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                    </>
                  )}
                </View>
              )}
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
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.2,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
  },
  addButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.semibold,
  },
  filtersContainer: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 12,
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
  },
  hiddenCount: {
    fontSize: typography.micro,
    fontWeight: fontWeights.regular,
    fontStyle: "italic",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
    borderWidth: 1,
  },
  toggleActive: {
    // Colors from theme
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  list: {
    gap: 10,
  },
  cardWrapper: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  card: {
    borderRadius: 16,
    padding: 16,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 5,
    borderWidth: 0.5,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    fontSize: typography.body,
  },
  exchangeName: {
    fontSize: typography.body,
    fontWeight: fontWeights.regular,
    marginBottom: 2,
  },
  exchangeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  ordersBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
  },
  ordersBadgeText: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.bold,
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
    fontSize: typography.tiny,
    fontWeight: fontWeights.regular,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.regular,
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
  expandIcon: {
    fontSize: typography.micro,
  },
  tokensContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
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
  loadingVariationsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  noTokensText: {
    fontSize: typography.caption,
    textAlign: "center",
    paddingVertical: 10,
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
    fontSize: typography.micro,
    fontWeight: fontWeights.light,
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
    fontWeight: fontWeights.regular,
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
    flexWrap: "wrap",
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
})
