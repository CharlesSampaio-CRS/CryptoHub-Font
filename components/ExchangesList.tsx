import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native"
import { useEffect, useState, useCallback, useMemo, memo } from "react"
import { apiService } from "@/services/api"
import { BalanceResponse } from "@/types/api"
import { config } from "@/lib/config"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"

// Mapeamento dos nomes das exchanges para os arquivos de imagem
const exchangeLogos: Record<string, any> = {
  "binance": require("@/assets/binance.png"),
  "novadax": require("@/assets/novadax.png"),
  "mexc": require("@/assets/mexc.png"),
  "coinbase": require("@/assets/coinbase.jpeg"),
  "kraken": require("@/assets/kraken.png"),
  "bybit": require("@/assets/bybit.png"),
  "gate.io": require("@/assets/gateio.png"),
  "kucoin": require("@/assets/kucoin.png"),
  "okx": require("@/assets/okx.png"),
}

export const ExchangesList = memo(function ExchangesList() {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null)
  const [hideZeroBalanceExchanges, setHideZeroBalanceExchanges] = useState(false)
  const [hideZeroBalanceTokens, setHideZeroBalanceTokens] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    fetchBalances()
    
    const handleBalancesUpdate = () => {
      setTimeout(() => fetchBalances(true, true), 100)
    }
    
    // Auto-refresh a cada 5 minutos (300000ms) - silencioso
    const autoRefreshInterval = setInterval(() => {
      fetchBalances(true, true)
    }, 5 * 60 * 1000)
    
    window.addEventListener('balancesUpdated', handleBalancesUpdate)
    
    return () => {
      window.removeEventListener('balancesUpdated', handleBalancesUpdate)
      clearInterval(autoRefreshInterval)
    }
  }, [])

  const fetchBalances = useCallback(async (forceRefresh = false, silent = false) => {
    try {
      // Não mostra loading depois da primeira carga
      if (!silent && !isInitialLoad) {
        setLoading(true)
      }
      setError(null)
      
      const response = await apiService.getBalances(config.userId)
      setData(response)
      
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }
    } catch (err) {
      setError(t('exchanges.error'))
    } finally {
      if (!silent && !isInitialLoad) {
        setLoading(false)
      }
      if (isInitialLoad) {
        setLoading(false)
      }
    }
  }, [t, isInitialLoad])

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        <Text style={styles.errorText}>{error || t('home.noData')}</Text>
      </View>
    )
  }

  // Filtrar exchanges com saldo zero se toggle ativado - memoizado
  const filteredExchanges = useMemo(() => 
    data.exchanges
      .filter(ex => ex.success)
      .filter(ex => {
        if (hideZeroBalanceExchanges) {
          return parseFloat(ex.total_usd) > 0
        }
        return true
      }),
    [data.exchanges, hideZeroBalanceExchanges]
  )

  const toggleExpandExchange = useCallback((exchangeId: string) => {
    setExpandedExchangeId(prev => prev === exchangeId ? null : exchangeId)
  }, [])

  const toggleZeroBalanceExchanges = useCallback(() => {
    setHideZeroBalanceExchanges(prev => !prev)
  }, [])

  const toggleZeroBalanceTokens = useCallback(() => {
    setHideZeroBalanceTokens(prev => !prev)
  }, [])
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Toggles de Filtro */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.toggleRow}
          onPress={toggleZeroBalanceExchanges}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleLabel}>{t('exchanges.hideZero')}</Text>
          <View style={[styles.toggle, hideZeroBalanceExchanges && styles.toggleActive]}>
            <View style={[styles.toggleThumb, hideZeroBalanceExchanges && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toggleRow}
          onPress={toggleZeroBalanceTokens}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleLabel}>{t('exchanges.hideZeroTokens')}</Text>
          <View style={[styles.toggle, hideZeroBalanceTokens && styles.toggleActive]}>
            <View style={[styles.toggleThumb, hideZeroBalanceTokens && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {filteredExchanges.map((exchange, index) => {
          const allTokens = Object.entries(exchange.tokens)
          
          // Filtrar tokens com saldo zero se toggle ativado
          let tokens = hideZeroBalanceTokens 
            ? allTokens.filter(([_, token]) => parseFloat(token.value_usd) > 0)
            : allTokens
          
          // Ordenar tokens por valor (maior para menor)
          tokens = tokens.sort((a, b) => {
            const valueA = parseFloat(a[1].value_usd)
            const valueB = parseFloat(b[1].value_usd)
            return valueB - valueA
          })
          
          const tokenCount = tokens.length
          const balance = parseFloat(exchange.total_usd)
          const exchangeNameLower = exchange.name.toLowerCase()
          const logoSource = exchangeLogos[exchangeNameLower]
          const isExpanded = expandedExchangeId === exchange.exchange_id
          
          // Debug log
          if (!logoSource) {
          }

          return (
            <View key={exchange.exchange_id} style={index !== filteredExchanges.length - 1 && styles.cardMargin}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => toggleExpandExchange(exchange.exchange_id)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.leftSection}>
                    <View style={styles.logoContainer}>
                      {logoSource ? (
                        <Image 
                          source={logoSource} 
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.logoFallback}>💰</Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.exchangeName}>{exchange.name}</Text>
                      <Text style={styles.assetsCount}>{tokenCount} {tokenCount === 1 ? 'ativo' : 'ativos'}</Text>
                    </View>
                  </View>

                  <View style={styles.rightSection}>
                    <Text style={styles.balance}>
                      {apiService.formatUSD(balance)}
                    </Text>
                    <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.tokensContainer}>
                  <Text style={styles.tokensTitle}>Tokens Disponíveis:</Text>
                  {tokens.length === 0 ? (
                    <Text style={styles.noTokensText}>Nenhum token disponível</Text>
                  ) : (
                    tokens.map(([symbol, token]) => {
                      const amount = parseFloat(token.amount)
                      const priceUSD = parseFloat(token.price_usd)
                      const valueUSD = parseFloat(token.value_usd)

                      return (
                        <View key={symbol} style={styles.tokenItem}>
                          <View style={styles.tokenLeft}>
                            <View style={styles.tokenSymbolBadge}>
                              <Text style={styles.tokenSymbol}>{symbol}</Text>
                            </View>
                            <View style={styles.tokenInfo}>
                              <Text style={styles.tokenAmount}>
                                {apiService.formatTokenAmount(token.amount)}
                              </Text>
                              {priceUSD > 0 && (
                                <Text style={styles.tokenPrice}>
                                  {apiService.formatUSD(priceUSD)}
                                </Text>
                              )}
                            </View>
                          </View>
                          <Text style={[styles.tokenValue, valueUSD === 0 && styles.tokenValueZero]}>
                            {apiService.formatUSD(valueUSD)}
                          </Text>
                        </View>
                      )
                    })
                  )}
                </View>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "400",
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#3b82f6",
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
    paddingVertical: 2,
  },
  toggleLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "400",
    flex: 1,
  },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#e3f2fd",
    padding: 2,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  toggleActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  toggleThumbActive: {
    transform: [{ translateX: 16 }],
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  cardMargin: {
    marginBottom: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    fontSize: 14,
  },
  exchangeName: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 2,
  },
  assetsCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: "400",
  },
  changePositive: {
    color: "#3b82f6",
  },
  changeNegative: {
    color: "#ef4444",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
    padding: 20,
  },
  expandIcon: {
    fontSize: 12,
    color: "#6b7280",
  },
  tokensContainer: {
    backgroundColor: "#f0f7ff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  tokensTitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#9ca3af",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noTokensText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 8,
  },
  tokenItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e3f2fd",
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tokenSymbolBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#3b82f6",
  },
  tokenSymbol: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3b82f6",
    letterSpacing: 0.5,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenAmount: {
    fontSize: 13,
    fontWeight: "400",
    marginBottom: 2,
  },
  tokenPrice: {
    fontSize: 11,
    color: "#6b7280",
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  tokenValueZero: {
    color: "#6b7280",
  },
})
