import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { useEffect, useState, useCallback, memo } from "react"
import { apiService } from "@/services/api"
import { BalanceResponse } from "@/types/api"
import { config } from "@/lib/config"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"

export const PortfolioOverview = memo(function PortfolioOverview() {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBalances()
    
    const handleBalancesUpdate = () => {
      setTimeout(() => fetchBalances(true, false, true), 100)
    }
    
    window.addEventListener('balancesUpdated', handleBalancesUpdate)
    
    return () => {
      window.removeEventListener('balancesUpdated', handleBalancesUpdate)
    }
  }, [])

  const fetchBalances = useCallback(async (forceRefresh = false, emitEvent = false, silent = false) => {
    try {
      // Nunca mostra loading se silent=true ou se já tem dados
      if (!silent && !data) {
        setLoading(true)
      } else if (!silent && forceRefresh) {
        setRefreshing(true)
      }
      setError(null)
      
      const response = await apiService.getBalances(config.userId)
      setData(response)
      
      // Em React Native, não precisamos de window.dispatchEvent
    } catch (err) {
      setError(t('common.error'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t, data])

  const handleRefresh = useCallback(() => {
    fetchBalances(true, true) // Force refresh e emite evento
  }, [fetchBalances])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={40} color="#3b82f6" />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || t('home.noData')}</Text>
      </View>
    )
  }

  const totalValue = parseFloat(data.summary.total_usd)
  const formattedValue = apiService.formatUSD(totalValue)
  const change24h = 0
  const isPositive = change24h > 0

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('home.portfolio')}</Text>
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
        {formattedValue}
      </Text>

      <View style={styles.changeContainer}>
        <View style={[styles.badge, isPositive ? styles.badgePositive : styles.badgeNegative]}>
          <Text style={[styles.badgeText, isPositive ? styles.textPositive : styles.textNegative]}>
            {isPositive ? "↑" : "↓"} {isPositive ? "+" : ""}
            {change24h.toFixed(2)}%
          </Text>
        </View>

        <Text style={[styles.changeValue, isPositive ? styles.textPositive : styles.textNegative]}>
          {isPositive ? "+" : ""}${0}
        </Text>

        <Text style={styles.timeframe}>{t('home.last24h')}</Text>
      </View>
    </View>
  )
})

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
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: {
    fontSize: 18,
    fontWeight: "300",
    opacity: 0.7,
  },
  value: {
    fontSize: 38,
    fontWeight: "200",
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
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  badgeNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "400",
  },
  textPositive: {
    color: "#3b82f6",
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
