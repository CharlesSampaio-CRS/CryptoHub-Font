import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { memo } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { apiService } from "@/services/api"
import { SkeletonPortfolioOverview } from "./SkeletonLoaders"

export const PortfolioOverview = memo(function PortfolioOverview() {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const { data, loading, error, refreshing, refresh } = useBalance()
  const { hideValue } = usePrivacy()
  const { evolutionData } = usePortfolio()

  if (loading) {
    return <SkeletonPortfolioOverview />
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
  
  console.log(`💰 PortfolioOverview: Total USD = $${totalValue} (timestamp: ${data.timestamp})`)
  
  // Formata o timestamp de última atualização
  const formatLastUpdated = () => {
    if (!data.timestamp) return ''
    
    // Garante que timestamp está em milissegundos
    let timestamp: string | number = data.timestamp
    if (typeof timestamp === 'number' && timestamp < 10000000000) {
      // Se for menor que isso, provavelmente está em segundos
      timestamp = timestamp * 1000
    }
    
    // Cria a data e ajusta para horário local do Brasil (UTC-3)
    const lastUpdate = new Date(timestamp)
    
    // Pega a hora e minuto locais (JavaScript já faz a conversão de UTC para local)
    const hours = lastUpdate.getHours()
    const minutes = lastUpdate.getMinutes()
    
    // Formata com zero à esquerda
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    // Calcula diferença de tempo
    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    // Sempre mostra "Atualizado em: HH:MM"
    if (diffMins < 60) return `Atualizado em: ${timeStr}`
    
    return `Atualizado em: ${timeStr}`
  }
  
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

      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: colors.text }]}>
          {hideValue(formattedValue)}
        </Text>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          {formatLastUpdated()}
        </Text>
      </View>

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
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 16,
  },
  value: {
    fontSize: 38,
    fontWeight: "200",
    letterSpacing: -1,
  },
  lastUpdated: {
    fontSize: 10,
    fontWeight: "400",
    opacity: 0.6,
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
