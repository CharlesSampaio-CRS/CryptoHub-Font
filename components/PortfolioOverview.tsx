import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { memo } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { apiService } from "@/services/api"
import { SkeletonPortfolioOverview } from "./SkeletonLoaders"

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

  // Define cores do gradiente baseado no tema - mesmo do gráfico (suave)
  const gradientColors: readonly [string, string, ...string[]] = isDark 
    ? ['rgba(30, 30, 35, 0.4)', 'rgba(40, 40, 45, 0.5)', 'rgba(30, 30, 35, 0.4)']  // Dark mode - cinza escuro neutro
    : ['rgba(59, 130, 246, 0.15)', 'rgba(96, 165, 250, 0.2)', 'rgba(147, 197, 253, 0.15)']  // Light mode - 15-20% opacidade

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
              console.log('🔄 PortfolioOverview: Botão refresh clicado! refreshing atual:', refreshing)
              refresh()
            }}
            disabled={refreshing}
            activeOpacity={refreshing ? 1 : 0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.refreshIcon, { color: colors.text }]}>↻</Text>
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
          <Text style={[
            styles.badgeText, 
            isPositive ? styles.textPositive : styles.textNegative
          ]}>
            {isPositive ? "↑" : "↓"} {hideValue(`${isPositive ? "+" : ""}${change24h.toFixed(2)}%`)}
          </Text>

          <Text style={[
            styles.changeValue,
            isPositive ? styles.textPositive : styles.textNegative
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
    marginBottom: 20,
  },
  container: {
    borderRadius: 20,
    padding: 24,
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
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  textPositive: {
    color: "#10b981", // Verde destacado
  },
  textNegative: {
    color: "#ef4444", // Vermelho destacado
  },
  changeValue: {
    fontSize: 14,
    fontWeight: "400",
  },
  timeframe: {
    fontSize: 12,
    fontWeight: "400",
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
  refreshButtonDisabled: {
    opacity: 0.5,
  },
})
