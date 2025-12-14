import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Image } from "react-native"
import { useEffect, useState, useRef } from "react"
import { apiService } from "@/services/api"
import { BalanceResponse } from "@/types/api"
import { config } from "@/lib/config"

// Mapeamento dos nomes das exchanges para os arquivos de imagem
const exchangeLogos: Record<string, any> = {
  "Binance": require("@/assets/binance.png"),
  "NovaDAX": require("@/assets/novadax.png"),
  "MEXC": require("@/assets/mexc.png"),
  "Coinbase": require("@/assets/coinbase.jpeg"),
  "Kraken": require("@/assets/kraken.png"),
  "Bybit": require("@/assets/bybit.png"),
  "Gate.io": require("@/assets/gateio.png"),
  "KuCoin": require("@/assets/kucoin.png"),
  "OKX": require("@/assets/okx.png"),
}

/**
 * Componente de Exchange com animação de expansão
 * Versão com animação suave usando Animated API
 */
function ExchangeItem({ 
  exchange, 
  isExpanded, 
  onToggle 
}: { 
  exchange: any
  isExpanded: boolean
  onToggle: () => void 
}) {
  const animatedHeight = useRef(new Animated.Value(0)).current
  const tokenCount = Object.keys(exchange.tokens).length
  const balance = parseFloat(exchange.total_usd)
  const logoSource = exchangeLogos[exchange.name]
  const tokens = Object.entries(exchange.tokens)

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [isExpanded])

  const maxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000], // Altura máxima estimada
  })

  const opacity = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <View>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={onToggle}
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
              <Text style={styles.assetsCount}>
                {tokenCount} {tokenCount === 1 ? 'ativo' : 'ativos'}
              </Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.balance}>
              {apiService.formatUSD(balance)}
            </Text>
            <Animated.Text 
              style={[
                styles.expandIcon,
                {
                  transform: [{
                    rotate: animatedHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    })
                  }]
                }
              ]}
            >
              ▼
            </Animated.Text>
          </View>
        </View>
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.tokensContainer,
          { 
            maxHeight,
            opacity,
            overflow: 'hidden',
          }
        ]}
      >
        <Text style={styles.tokensTitle}>Tokens Disponíveis:</Text>
        {tokens.length === 0 ? (
          <Text style={styles.noTokensText}>Nenhum token disponível</Text>
        ) : (
          tokens.map(([symbol, token]: [string, any]) => {
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
      </Animated.View>
    </View>
  )
}

export function ExchangesListAnimated() {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null)

  useEffect(() => {
    fetchBalances()
  }, [])

  const fetchBalances = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getBalances(config.userId)
      setData(response)
    } catch (err) {
      setError("Erro ao carregar exchanges")
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

  const exchanges = data.exchanges.filter(ex => ex.success)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exchanges</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {exchanges.map((exchange, index) => (
          <View key={exchange.exchange_id} style={index !== exchanges.length - 1 && styles.cardMargin}>
            <ExchangeItem
              exchange={exchange}
              isExpanded={expandedExchangeId === exchange.exchange_id}
              onToggle={() => setExpandedExchangeId(
                expandedExchangeId === exchange.exchange_id ? null : exchange.exchange_id
              )}
            />
          </View>
        ))}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
})
