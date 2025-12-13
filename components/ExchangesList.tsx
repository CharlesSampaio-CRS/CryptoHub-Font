import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { BalanceResponse } from "@/types/api"
import { config } from "@/lib/config"

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

export function ExchangesList() {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null)
  const [hideZeroBalanceExchanges, setHideZeroBalanceExchanges] = useState(true)
  const [hideZeroBalanceTokens, setHideZeroBalanceTokens] = useState(true)

  useEffect(() => {
    fetchBalances()
    
    // Listener para atualização de balances
    const handleBalancesUpdate = () => {
      console.log('📡 ExchangesList recebeu evento de atualização')
      fetchBalances(true) // Force refresh quando receber evento
    }
    
    window.addEventListener('balancesUpdated', handleBalancesUpdate)
    
    return () => {
      window.removeEventListener('balancesUpdated', handleBalancesUpdate)
    }
  }, [])

  const fetchBalances = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const url = forceRefresh 
        ? `http://localhost:5000/api/v1/balances?user_id=${config.userId}&force_refresh=true`
        : undefined
      
      const response = url 
        ? await fetch(url).then(res => res.json())
        : await apiService.getBalances(config.userId)
      
      setData(response)
      
      if (forceRefresh) {
        console.log('✅ ExchangesList atualizado com sucesso!')
      }
    } catch (err) {
      setError("Erro ao carregar exchanges")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Exchanges</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Exchanges</Text>
        <Text style={styles.errorText}>{error || "Dados não disponíveis"}</Text>
      </View>
    )
  }

  // Filtrar exchanges com saldo zero se toggle ativado
  const filteredExchanges = data.exchanges
    .filter(ex => ex.success)
    .filter(ex => {
      if (hideZeroBalanceExchanges) {
        return parseFloat(ex.total_usd) > 0
      }
      return true
    })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exchanges</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Toggles de Filtro */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.toggleRow}
          onPress={() => setHideZeroBalanceExchanges(!hideZeroBalanceExchanges)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleLabel}>Ocultar exchanges com saldo $0</Text>
          <View style={[styles.toggle, hideZeroBalanceExchanges && styles.toggleActive]}>
            <View style={[styles.toggleThumb, hideZeroBalanceExchanges && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toggleRow}
          onPress={() => setHideZeroBalanceTokens(!hideZeroBalanceTokens)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleLabel}>Ocultar tokens com saldo $0</Text>
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
            console.log('Logo not found for:', exchange.name, '(lowercase:', exchangeNameLower + ')')
            console.log('Available logos:', Object.keys(exchangeLogos))
          }

          return (
            <View key={exchange.exchange_id} style={index !== filteredExchanges.length - 1 && styles.cardMargin}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => setExpandedExchangeId(isExpanded ? null : exchange.exchange_id)}
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
                                  @ {apiService.formatUSD(priceUSD)}
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
}

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
    fontWeight: "600",
    color: "#f9fafb",
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10b981",
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
    backgroundColor: "#1a1a1a",
    padding: 2,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  toggleActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
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
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
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
    gap: 12,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    fontSize: 20,
  },
  exchangeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f9fafb",
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
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
  },
  changePositive: {
    color: "#10b981",
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
    backgroundColor: "#0a0a0a",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  tokensTitle: {
    fontSize: 13,
    fontWeight: "600",
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
    borderBottomColor: "#1a1a1a",
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tokenSymbolBadge: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  tokenSymbol: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: 0.5,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 2,
  },
  tokenPrice: {
    fontSize: 11,
    color: "#6b7280",
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f9fafb",
  },
  tokenValueZero: {
    color: "#6b7280",
  },
})
