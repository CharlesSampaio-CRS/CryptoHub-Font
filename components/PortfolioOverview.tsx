import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { BalanceResponse } from "@/types/api"
import { config } from "@/lib/config"

export function PortfolioOverview() {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBalances()
  }, [])

  const fetchBalances = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
        console.log('🔄 Forçando atualização dos balances...')
      } else {
        setLoading(true)
      }
      setError(null)
      
      const url = forceRefresh 
        ? `http://localhost:5000/api/v1/balances?user_id=${config.userId}&force_refresh=true`
        : undefined
      
      const response = url 
        ? await fetch(url).then(res => res.json())
        : await apiService.getBalances(config.userId)
      
      setData(response)
      
      if (forceRefresh) {
        console.log('✅ Balances atualizados com sucesso!')
      }
    } catch (err) {
      setError("Erro ao carregar dados")
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchBalances(true)
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || "Dados não disponíveis"}</Text>
      </View>
    )
  }

  const totalValue = parseFloat(data.summary.total_usd)
  // Por enquanto não temos dados de mudança 24h da API, então usando 0
  const change24h = 0
  const changeValue = 0
  const isPositive = change24h > 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Patrimônio Total</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <Text style={styles.refreshIcon}>🔄</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.value}>
        {apiService.formatUSD(totalValue)}
      </Text>

      <View style={styles.changeContainer}>
        <View style={[styles.badge, isPositive ? styles.badgePositive : styles.badgeNegative]}>
          <Text style={[styles.badgeText, isPositive ? styles.textPositive : styles.textNegative]}>
            {isPositive ? "↑" : "↓"} {isPositive ? "+" : ""}
            {change24h.toFixed(2)}%
          </Text>
        </View>

        <Text style={[styles.changeValue, isPositive ? styles.textPositive : styles.textNegative]}>
          {isPositive ? "+" : ""}{apiService.formatUSD(changeValue)}
        </Text>

        <Text style={styles.timeframe}>últimas 24h</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  refreshIcon: {
    fontSize: 14,
    opacity: 0.8,
  },
  value: {
    fontSize: 36,
    fontWeight: "700",
    color: "#f9fafb",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePositive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  badgeNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  textPositive: {
    color: "#10b981",
  },
  textNegative: {
    color: "#ef4444",
  },
  changeValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  timeframe: {
    fontSize: 12,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
  },
  exchangesCount: {
    fontSize: 12,
    color: "#6b7280",
  },
})
