import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useState } from "react"
import { apiService } from "@/services/api"
import { typography, fontWeights } from "@/lib/typography"
import { Exchange } from "@/types/api"
import { TokenDetailsModal } from "./token-details-modal"
import { useLanguage } from "@/contexts/LanguageContext"

interface TokensListProps {
  exchange: Exchange
}

export function TokensList({ exchange }: TokensListProps) {
  const { t } = useLanguage()
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  
  // Lista de stablecoins e moedas fiat
  const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'FDUSD', 'USDD', 'BRL', 'EUR', 'USD']
  
  // Filtra e ordena tokens: stablecoins por último, depois por variação, depois por valor
  const tokens = Object.entries(exchange.tokens)
    .filter(([_, token]) => parseFloat(token.value_usd) > 0)
    .sort((a, b) => {
      const [symbolA, tokenA] = a
      const [symbolB, tokenB] = b
      
      // Verifica se é stablecoin
      const isStablecoinA = STABLECOINS.includes(symbolA.toUpperCase())
      const isStablecoinB = STABLECOINS.includes(symbolB.toUpperCase())
      
      // Stablecoins vão para o final
      if (isStablecoinA && !isStablecoinB) return 1
      if (!isStablecoinA && isStablecoinB) return -1
      
      // Se ambos são ou não são stablecoins, verificar variações
      const hasVariationA = tokenA.change_1h !== null || tokenA.change_4h !== null || tokenA.change_24h !== null
      const hasVariationB = tokenB.change_1h !== null || tokenB.change_4h !== null || tokenB.change_24h !== null
      
      // Tokens com variação vêm primeiro
      if (hasVariationA && !hasVariationB) return -1
      if (!hasVariationA && hasVariationB) return 1
      
      // Se ambos têm ou não têm variação, ordenar por valor
      const valueA = parseFloat(tokenA.value_usd)
      const valueB = parseFloat(tokenB.value_usd)
      return valueB - valueA
    })

  const handleTokenPress = (symbol: string) => {
    setSelectedToken(symbol)
    setModalVisible(true)
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setTimeout(() => {
      setSelectedToken(null)
    }, 300)
  }

  if (tokens.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('token.noBalance')}</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('token.tokensIn')} {exchange.name}</Text>
      
      {tokens.map(([symbol, token]) => {
        const amount = parseFloat(token.amount)
        const priceUSD = parseFloat(token.price_usd)
        const valueUSD = parseFloat(token.value_usd)

        return (
          <TouchableOpacity 
            key={symbol} 
            style={styles.tokenCard}
            onPress={() => handleTokenPress(symbol)}
            activeOpacity={0.7}
          >
            <View style={styles.tokenHeader}>
              <View style={styles.symbolContainer}>
                <Text style={styles.symbol}>{symbol.toLowerCase()}</Text>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{apiService.formatUSD(valueUSD)}</Text>
                {priceUSD > 0 && (
                  <Text style={styles.price}>{apiService.formatUSD(priceUSD)}</Text>
                )}
              </View>
            </View>

            <View style={styles.tokenDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('token.amount')}</Text>
                <Text style={styles.detailValue}>
                  {apiService.formatTokenAmount(token.amount)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      })}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{t('token.totalIn')} {exchange.name}</Text>
        <Text style={styles.totalValue}>
          {apiService.formatUSD(parseFloat(exchange.total_usd))}
        </Text>
      </View>

      {/* Modal de Detalhes do Token */}
      {selectedToken && (
        <TokenDetailsModal
          visible={modalVisible}
          onClose={handleCloseModal}
          exchangeId={exchange.exchange_id}
          symbol={selectedToken}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7ff",
  },
  title: {
    fontSize: typography.h2, // 24px
    fontWeight: fontWeights.bold,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    color: "#111827",
    letterSpacing: -0.3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: typography.bodyLarge, // 17px
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  tokenCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20, // 16→20
    marginHorizontal: 20, // 16→20
    marginBottom: 16, // 12→16
    borderWidth: 1,
    borderColor: "#e3f2fd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16, // 12→16
  },
  symbolContainer: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12, // 8→12
    paddingVertical: 6, // 4→6
    borderRadius: 8, // 6→8
    minWidth: 80,
    alignItems: "center",
  },
  symbol: {
    fontSize: typography.body, // tiny→body (16px)
    fontWeight: fontWeights.bold, // medium→bold
    color: "#3b82f6",
    letterSpacing: 0.5,
  },
  valueContainer: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: 12,
  },
  value: {
    fontSize: typography.h3, // h4→h3 (20px)
    fontWeight: fontWeights.bold, // medium→bold
    color: "#111827",
  },
  price: {
    fontSize: typography.body, // caption→body (16px)
    fontWeight: fontWeights.regular,
    color: "#6b7280",
    marginTop: 4, // 2→4
  },
  tokenDetails: {
    gap: 12, // 8→12
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  detailLabel: {
    fontSize: typography.body, // bodySmall→body (16px)
    color: "#6b7280",
    fontWeight: fontWeights.medium,
  },
  detailValue: {
    fontSize: typography.body, // bodySmall→body (16px)
    fontWeight: fontWeights.medium, // regular→medium
    color: "#111827",
  },
  totalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16, // 12→16
    padding: 24, // 20→24
    marginHorizontal: 20, // 16→20
    marginBottom: 24, // 16→24
    marginTop: 12, // 8→12
    borderWidth: 2,
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  totalLabel: {
    fontSize: typography.body, // bodySmall→body (16px)
    color: "#6b7280",
    marginBottom: 12, // 8→12
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: typography.displaySmall, // h1→displaySmall (24px)
    fontWeight: fontWeights.bold, // medium→bold
    color: "#3b82f6",
    letterSpacing: -0.5,
  },
})
