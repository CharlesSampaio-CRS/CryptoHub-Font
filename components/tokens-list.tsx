import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { useState } from "react"
import { apiService } from "@/services/api"
import { Exchange } from "@/types/api"
import { TokenDetailsModal } from "./token-details-modal"

interface TokensListProps {
  exchange: Exchange
}

export function TokensList({ exchange }: TokensListProps) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  
  const tokens = Object.entries(exchange.tokens).filter(
    ([_, token]) => parseFloat(token.value_usd) > 0
  )

  const handleTokenPress = (symbol: string) => {
    console.log(`🔍 Token clicado: ${symbol} na exchange ${exchange.name} (${exchange.exchange_id})`)
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
        <Text style={styles.emptyText}>Nenhum token com saldo disponível</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tokens em {exchange.name}</Text>
      
      {tokens.map(([symbol, token]) => {
        const amount = parseFloat(token.amount)
        const priceUSD = parseFloat(token.price_usd)
        const valueUSD = parseFloat(token.value_usd)
        const change1h = token.change_1h ? parseFloat(token.change_1h) : null
        const change4h = token.change_4h ? parseFloat(token.change_4h) : null
        const change24h = token.change_24h ? parseFloat(token.change_24h) : null

        const getChangeColor = (change: number | null) => {
          if (change === null) return '#6b7280'
          return change >= 0 ? '#10b981' : '#ef4444'
        }

        const formatChange = (change: number | null) => {
          if (change === null) return 'N/A'
          const sign = change >= 0 ? '+' : ''
          return `${sign}${change.toFixed(2)}%`
        }

        return (
          <TouchableOpacity 
            key={symbol} 
            style={styles.tokenCard}
            onPress={() => handleTokenPress(symbol)}
            activeOpacity={0.7}
          >
            <View style={styles.tokenHeader}>
              <View style={styles.symbolContainer}>
                <Text style={styles.symbol}>{symbol}</Text>
              </View>
              <View style={styles.valueContainer}>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>{apiService.formatUSD(valueUSD)}</Text>
                  {change24h !== null && (
                    <View style={styles.changeInlineBadge}>
                      <Text style={[styles.changeInlineText, { color: getChangeColor(change24h) }]}>
                        {formatChange(change24h)}
                      </Text>
                    </View>
                  )}
                </View>
                {priceUSD > 0 && (
                  <Text style={styles.price}>{apiService.formatUSD(priceUSD)}</Text>
                )}
              </View>
            </View>

            <View style={styles.tokenDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantidade:</Text>
                <Text style={styles.detailValue}>
                  {apiService.formatTokenAmount(token.amount)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )
      })}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total em {exchange.name}</Text>
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
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  tokenCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  symbolContainer: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  symbol: {
    fontSize: 11,
    fontWeight: "500",
    color: "#3b82f6",
    letterSpacing: 0.3,
  },
  valueContainer: {
    alignItems: "flex-end",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  changeInlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  changeInlineText: {
    fontSize: 11,
    fontWeight: "400",
  },
  price: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6b7280",
    marginTop: 2,
  },
  tokenDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#9ca3af",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "400",
  },
  totalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  totalLabel: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "500",
    color: "#3b82f6",
  },
})
