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
import { typography, fontWeights } from "@/lib/typography"

export const PortfolioOverview = memo(function PortfolioOverview() {
  const { colors, isDark } = useTheme()
  const { t } = useLanguage()
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

  if (loading) {
    return <SkeletonPortfolioOverview />
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error || t('home.noData')}</Text>
      </View>
    )
  }

  const totalValue = parseFloat(data.summary.total_usd)
  const formattedValue = apiService.formatUSD(totalValue)
  
  
  // Formata o timestamp de última atualização usando o state local
  const formatLastUpdated = () => {
    if (!lastUpdateTime) return ''
    
    const timeStr = lastUpdateTime.toLocaleTimeString('pt-BR', { 
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
        {/* Info sobre cálculo do patrimônio */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.infoIconContainer}>
            <Text style={styles.infoIconYellow}>i</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.text }]}>
            {t('portfolio.basedOnBalance')}
          </Text>
        </View>

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
            {hideValue(formattedValue)}
          </Text>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            {formatLastUpdated()}
          </Text>
        </View>

        <View style={[styles.changeContainer, { borderTopColor: colors.borderLight }]}>
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
            {hideValue(`${isPositive ? "+" : ""}${apiService.formatUSD(Math.abs(pnl.changeUsd))}`)}
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
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.5,
    opacity: 0.8,
  },
  infoIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFA500",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconYellow: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.bold,
    color: "#FFFFFF",
  },
  infoText: {
    fontSize: typography.micro,
    fontWeight: fontWeights.light,
    flex: 1,
    lineHeight: 14,
  },
  container: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: typography.body,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
    gap: 8,
    marginBottom: 20,
  },
  value: {
    fontSize: typography.displayLarge,
    fontWeight: fontWeights.light,
    letterSpacing: -1.5,
  },
  lastUpdated: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.regular,
    opacity: 0.5,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  badgeText: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.regular,
  },
  changeValue: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.regular,
    flex: 1,
  },
  timeframe: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.regular,
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
