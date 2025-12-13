import { View, Text, StyleSheet, ScrollView } from "react-native"
import { apiService } from "@/services/api"
import { Exchange } from "@/types/api"

interface TokensListProps {
  exchange: Exchange
}

export function TokensList({ exchange }: TokensListProps) {
  const tokens = Object.entries(exchange.tokens).filter(
    ([_, token]) => parseFloat(token.value_usd) > 0
  )

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

        return (
          <View key={symbol} style={styles.tokenCard}>
            <View style={styles.tokenHeader}>
              <View style={styles.symbolContainer}>
                <Text style={styles.symbol}>{symbol}</Text>
              </View>
              <Text style={styles.value}>{apiService.formatUSD(valueUSD)}</Text>
            </View>

            <View style={styles.tokenDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantidade:</Text>
                <Text style={styles.detailValue}>
                  {apiService.formatTokenAmount(token.amount)}
                </Text>
              </View>

              {priceUSD > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Preço:</Text>
                  <Text style={styles.detailValue}>
                    {apiService.formatUSD(priceUSD)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )
      })}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total em {exchange.name}</Text>
        <Text style={styles.totalValue}>
          {apiService.formatUSD(parseFloat(exchange.total_usd))}
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f9fafb",
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
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  tokenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  symbolContainer: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  symbol: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f9fafb",
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
    fontWeight: "600",
    color: "#f9fafb",
  },
  totalCard: {
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  totalLabel: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10b981",
  },
})
