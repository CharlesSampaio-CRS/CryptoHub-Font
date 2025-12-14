import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { BalanceResponse } from "@/types/api"
import { config } from "@/lib/config"
import { useTheme } from "@/contexts/ThemeContext"

export function PortfolioOverview() {
  const { colors } = useTheme()
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBalances()
    
    // Listener para atualização de balances
    const handleBalancesUpdate = () => {
      fetchBalances(true) // Force refresh quando receber evento
    }
    
    window.addEventListener('balancesUpdated', handleBalancesUpdate)
    
    return () => {
      window.removeEventListener('balancesUpdated', handleBalancesUpdate)
    }
  }, [])

  const fetchBalances = async (forceRefresh = false, emitEvent = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const url = forceRefresh 
        ? `${config.apiBaseUrl}/balances?user_id=${config.userId}&force_refresh=true`
        : undefined
      
      const response = url 
        ? await fetch(url).then(res => res.json())
        : await apiService.getBalances(config.userId)
      
      setData(response)
      
      if (forceRefresh) {
        // Disparar evento apenas quando for refresh manual (botão)
        if (emitEvent) {
          window.dispatchEvent(new Event('balancesUpdated'))
        }
      }
    } catch (err) {
      setError("Erro ao carregar dados")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchBalances(true, true) // Force refresh e emite evento
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
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Patrimônio Total</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={[styles.refreshIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.refreshIcon, { color: colors.primary }]}>↻</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.value, { color: colors.text }]}>
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: {
    fontSize: 20,
    fontWeight: "400",
  },
  value: {
    fontSize: 42,
    fontWeight: "300",
    letterSpacing: -1,
    marginBottom: 16,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgePositive: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  badgeNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "400",
  },
  textPositive: {
    color: "#10b981",
  },
  textNegative: {
    color: "#ef4444",
  },
  changeValue: {
    fontSize: 13,
    fontWeight: "400",
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
