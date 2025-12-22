import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { memo } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { apiService } from "@/services/api"
import { SkeletonPortfolioOverview } from "./SkeletonLoaders"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"

export const PortfolioOverview = memo(function PortfolioOverview() {
  const { colors, isDark } = useTheme()
  const { t } = useLanguage()
  const { data, loading, error, refreshing, refresh } = useBalance()
  const { hideValue } = usePrivacy()
  const { evolutionData, currentPeriod } = usePortfolio()

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
            Últimos {currentPeriod} dias
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
    fontSize: 14,
    fontWeight: "400",
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
    fontSize: 20,
    fontWeight: "300",
    opacity: 0.7,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 20,
  },
  value: {
    fontSize: 42,
    fontWeight: "300",
    letterSpacing: -1.5,
  },
  lastUpdated: {
    fontSize: 11,
    fontWeight: "400",
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
    fontSize: 15,
    fontWeight: "400",
  },
  changeValue: {
    fontSize: 15,
    fontWeight: "400",
    flex: 1,
  },
  timeframe: {
    fontSize: 13,
    fontWeight: "400",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  exchangesCount: {
    fontSize: 12,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
})
