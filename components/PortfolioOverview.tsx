import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { memo, useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { config } from "@/lib/config"
import { PortfolioEvolutionResponse } from "@/types/api"

export const PortfolioOverview = memo(function PortfolioOverview() {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const { data, loading, error, refreshing, refresh } = useBalance()
  const { hideValue } = usePrivacy()
  const [evolutionData, setEvolutionData] = useState<PortfolioEvolutionResponse | null>(null)

  useEffect(() => {
    loadEvolutionData()
  }, [])

  const loadEvolutionData = async () => {
    try {
      const evolution = await apiService.getPortfolioEvolution(config.userId, 7)
      setEvolutionData(evolution)
    } catch (err) {
      console.error('Error loading evolution data:', err)
    }
  }

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
  
  // Calcula PNL baseado nos dados de evolução
  const getPNL = () => {
    if (!evolutionData?.evolution?.summary) {
      return {
        changeUsd: 0,
        changePercent: 0,
        isPositive: false,
      }
    }

    const { change_usd, change_percent } = evolutionData.evolution.summary
    const changeUsdValue = parseFloat(change_usd)
    const changePercentValue = parseFloat(change_percent)

    return {
      changeUsd: changeUsdValue,
      changePercent: changePercentValue,
      isPositive: changeUsdValue >= 0,
    }
  }

  const pnl = getPNL()
  const change24h = pnl.changePercent
  const isPositive = pnl.isPositive

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('home.portfolio')}</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.refreshIconContainer}>
              <Text style={[styles.refreshIcon, { color: colors.primary }]}>↻</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.value, { color: colors.text }]}>
        {hideValue(formattedValue)}
      </Text>

      <View style={styles.changeContainer}>
        <View style={[styles.badge, isPositive ? styles.badgePositive : styles.badgeNegative]}>
          <Text style={[styles.badgeText, isPositive ? styles.textPositive : styles.textNegative]}>
            {isPositive ? "↑" : "↓"} {hideValue(`${isPositive ? "+" : ""}${change24h.toFixed(2)}%`)}
          </Text>
        </View>

        <Text style={[styles.changeValue, isPositive ? styles.textPositive : styles.textNegative]}>
          {hideValue(`${isPositive ? "+" : ""}${apiService.formatUSD(Math.abs(pnl.changeUsd))}`)}
        </Text>

        <Text style={styles.timeframe}>Últimos 7 dias</Text>
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
