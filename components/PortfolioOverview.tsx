import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { memo, useState, useEffect } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { apiService } from "@/services/api"
import { SkeletonPortfolioOverview } from "./SkeletonLoaders"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"
import { PortfolioChart } from "./PortfolioChart"
import { typography, fontWeights } from "@/lib/typography"

export const PortfolioOverview = memo(function PortfolioOverview() {
  const { colors, isDark } = useTheme()
  const { t, language } = useLanguage()
  const { data, loading, error, refreshing, refresh } = useBalance()
  const { hideValue } = usePrivacy()
  const { evolutionData, currentPeriod } = usePortfolio()
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  // Atualiza o timestamp local quando os dados do balance mudam
  useEffect(() => {
    if (data?.timestamp) {
      setLastUpdateTime(new Date())
    }
  }, [data?.timestamp])

  // Mostra skeleton durante loading inicial ou quando não há dados ainda
  if (loading || (!data && !error)) {
    return <SkeletonPortfolioOverview />
  }

  if (error || !data || !data.summary) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error || t('home.noData')}
        </Text>
      </View>
    )
  }

  const totalValue = parseFloat(data.summary.total_usd || '0')
  const formattedValue = apiService.formatUSD(totalValue)
  
  
  // Formata o timestamp de última atualização usando o state local
  const formatLastUpdated = () => {
    if (!lastUpdateTime) return ''
    
    const timeStr = lastUpdateTime.toLocaleTimeString(language, { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    return `${t('portfolio.updatedAt')}: ${timeStr}`
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

  // Define cores do gradiente baseado no tema - tons neutros
  const gradientColors: readonly [string, string, ...string[]] = isDark 
    ? ['rgba(26, 26, 26, 0.95)', 'rgba(38, 38, 38, 0.95)', 'rgba(26, 26, 26, 0.95)']  // Dark mode - preto/cinza escuro
    : ['rgba(250, 250, 250, 1)', 'rgba(252, 252, 252, 1)', 'rgba(250, 250, 250, 1)']  // Light mode - cinza claríssimo quase branco
  
  return (
    <View style={styles.containerWrapper}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, { borderColor: colors.border }]}
      >
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.text }]}>{t('home.portfolio')}</Text>
          <TouchableOpacity 
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={() => {
              refresh()
            }}
            disabled={refreshing}
            activeOpacity={refreshing ? 1 : 0.7}
          >
            {refreshing ? (
              <AnimatedLogoIcon size={20} />
            ) : (
              <Text style={[styles.refreshIcon, { color: colors.primary }]}>↻</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: colors.text }]}>
            {hideValue(`$${formattedValue}`)}
          </Text>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            {formatLastUpdated()}
          </Text>
        </View>

        {/* Portfolio Chart */}
        <PortfolioChart />

        {/* PNL Container - separado com borda superior */}
        <View style={[styles.changeContainer, { borderTopColor: colors.border }]}>
          <Text style={[
            styles.badgeText, 
            { color: isPositive ? colors.success : colors.danger }
          ]}>
             {isPositive ? "↑" : "↓"} {hideValue(`${isPositive ? "+" : ""}${change24h.toFixed(2)}%`)}
          </Text>

          <Text style={[
            styles.changeValue,
            { color: isPositive ? colors.success : colors.danger }
          ]}>
            {hideValue(`${isPositive ? "+" : ""}$${apiService.formatUSD(Math.abs(pnl.changeUsd))}`)}
          </Text>
          <Text style={[styles.timeframe, { color: colors.textSecondary }]}>
            {t('portfolio.lastDays').replace('{days}', currentPeriod.toString())}
          </Text>
        </View>
      </LinearGradient>
    </View>
  )
})

const styles = StyleSheet.create({
  containerWrapper: {
    marginBottom: 12,
  },
  container: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: {
    fontSize: typography.displaySmall,
    fontWeight: fontWeights.light,
    opacity: 0.7,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 8,
  },
  value: {
    fontSize: typography.display,
    fontWeight: fontWeights.light,
    letterSpacing: -1,
  },
  lastUpdated: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.light,
    opacity: 0.5,
  },
  changeContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
  },
  changeValue: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
    flex: 1,
  },
  timeframe: {
    fontSize: typography.caption,
    fontWeight: fontWeights.light,
  },
  errorText: {
    fontSize: typography.body,
    textAlign: "center",
  },
  exchangesCount: {
    fontSize: typography.caption,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
})
