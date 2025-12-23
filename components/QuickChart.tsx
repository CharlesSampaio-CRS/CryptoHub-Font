import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback } from "react-native"
import { memo, useState, useEffect, useMemo } from "react"
import { LineChart } from "react-native-chart-kit"
import { LinearGradient } from "expo-linear-gradient"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { typography, fontWeights } from "@/lib/typography"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { SkeletonChart } from "./SkeletonLoaders"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"

const screenWidth = Dimensions.get("window").width

export const QuickChart = memo(function QuickChart() {
  const { t } = useLanguage()
  const { colors, isDark } = useTheme()
  const { evolutionData, loading, error, refreshEvolution } = usePortfolio()
  const { valuesHidden } = usePrivacy()
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 15 | 30>(7) // Período padrão: 7 dias
  const [isChangingPeriod, setIsChangingPeriod] = useState(false)
  const [previousData, setPreviousData] = useState<any>(null)

  // Busca novos dados quando o período mudar
  useEffect(() => {
    setIsChangingPeriod(true)
    refreshEvolution(selectedPeriod).finally(() => {
      setIsChangingPeriod(false)
    })
  }, [selectedPeriod, refreshEvolution])

  // Salva dados anteriores quando novos dados chegam
  useEffect(() => {
    if (evolutionData && !isChangingPeriod) {
      setPreviousData(evolutionData)
    }
  }, [evolutionData, isChangingPeriod])

  // Calcula estatísticas do período
  const stats = useMemo(() => {
    if (!evolutionData?.evolution?.values_usd || evolutionData.evolution.values_usd.length === 0) {
      return { change: 0, changePercent: 0, highest: 0, lowest: 0, isPositive: true }
    }

    const values = evolutionData.evolution.values_usd
    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const change = lastValue - firstValue
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0
    const highest = Math.max(...values)
    const lowest = Math.min(...values)

    return {
      change,
      changePercent,
      highest,
      lowest,
      isPositive: change >= 0,
    }
  }, [evolutionData])

  // Processa dados para o gráfico
  const getChartData = () => {
    // Durante o carregamento, usa dados anteriores se disponíveis
    const dataToUse = (isChangingPeriod && previousData) ? previousData : evolutionData
    
    if (!dataToUse?.evolution) {
      return {
        labels: [""],
        datasets: [{ data: [0] }],
      }
    }

    const { timestamps, values_usd } = dataToUse.evolution
    
    // Backend já retorna os dados do período correto, não precisa fazer slice
    
    // Formata labels para mobile - mostra apenas alguns para evitar sobreposição
    const labels = timestamps.map((ts: string | number, index: number) => {
      const date = new Date(ts)
      const day = date.getDate()
      const month = date.getMonth() + 1
      
      // Define quantos labels mostrar baseado no período
      const labelsToShow = selectedPeriod === 7 ? 4 : selectedPeriod === 15 ? 5 : 6
      const interval = Math.floor(timestamps.length / (labelsToShow - 1))
      
      // No mobile, mostra labels espaçados
      if (screenWidth < 400) {
        if (index === 0 || index === timestamps.length - 1 || index % interval === 0) {
          return `${day}/${month}`
        }
        return '' // Label vazio para os demais
      }
      
      // Tablets e maiores: mostra todos
      return `${day}/${month}`
    })

    return {
      labels,
      datasets: [
        {
          data: values_usd,
          color: (opacity = 1) => {
            const color = stats.isPositive ? '#10b981' : '#ef4444' // Verde ou vermelho
            return color + Math.round(opacity * 255).toString(16).padStart(2, '0')
          },
          strokeWidth: 3.5,
        },
      ],
    }
  }

  const chartData = getChartData()
  
  // Cores do gradiente baseado no tema - tons neutros
  const gradientColors: readonly [string, string, ...string[]] = isDark 
    ? ['rgba(26, 26, 26, 0.95)', 'rgba(38, 38, 38, 0.95)', 'rgba(26, 26, 26, 0.95)']  // Dark mode - preto/cinza
    : ['rgba(248, 249, 250, 0.95)', 'rgba(255, 255, 255, 0.95)', 'rgba(248, 249, 250, 0.95)']  // Light mode - cinza claro neutro
  
  // Formata valores para exibição
  const formatValue = (val: number) => {
    if (valuesHidden) {
      return '••••••'
    }
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`
    } else if (val >= 1000) {
      return `$${(val / 1000).toFixed(2)}K`
    }
    return `$${val.toFixed(2)}`
  }

  if (loading) {
    return <SkeletonChart />
  }
  
  return (
    <TouchableWithoutFeedback onPress={() => setSelectedPointIndex(null)}>
      <View style={styles.containerWrapper}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, { borderColor: colors.cardBorder }]}
        >
          <View style={styles.headerContainer}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.text }]}>{t('home.performance')}</Text>
            </View>
          
            {/* Botões de período */}
            <View style={styles.periodButtonsContainer}>
              {[7, 15, 30].map((period) => (
                <TouchableWithoutFeedback 
                  key={period}
                  onPress={() => setSelectedPeriod(period as 7 | 15 | 30)}
                >
                  <View style={[
                    styles.periodButton,
                    { 
                      backgroundColor: selectedPeriod === period ? colors.primary : 'transparent',
                      borderColor: selectedPeriod === period ? colors.primary : colors.border
                    }
                  ]}>
                    <Text style={[
                      styles.periodButtonText,
                      { color: selectedPeriod === period ? colors.primaryText : colors.textSecondary }
                    ]}>
                      {period}d
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {error}
              </Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={240}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom: "transparent",
                backgroundGradientTo: "transparent",
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                fillShadowGradient: stats.isPositive ? '#10b981' : '#ef4444',
                fillShadowGradientOpacity: 0.25,
                fillShadowGradientTo: stats.isPositive ? '#10b98110' : '#ef444410',
                fillShadowGradientToOpacity: 0.08,
                decimalPlaces: 0,
                color: (opacity = 1) => {
                  const baseColor = stats.isPositive ? '#10b981' : '#ef4444'
                  return baseColor + Math.round(opacity * 255).toString(16).padStart(2, '0')
                },
                labelColor: (opacity = 1) => colors.textSecondary + Math.round(opacity * 255).toString(16).padStart(2, '0'),
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "0",
                  fill: stats.isPositive ? '#10b981' : '#ef4444',
                },
                propsForBackgroundLines: {
                  strokeDasharray: "5,5",
                  stroke: colors.border,
                  strokeWidth: 0.8,
                  strokeOpacity: 0.4,
                },
                propsForLabels: {
                  fontSize: 10,
                  fontFamily: 'System',
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={true}
              withShadow={false}
              withVerticalLines={true}
              withHorizontalLines={true}
              segments={4}
              formatYLabel={(value) => {
                if (valuesHidden) {
                  return '••••'
                }
                const num = parseFloat(value)
                if (num >= 1000000) {
                  return `$${(num / 1000000).toFixed(1)}M`
                } else if (num >= 1000) {
                  return `$${(num / 1000).toFixed(1)}K`
                }
                return `$${Math.round(num)}`
              }}
              onDataPointClick={(data) => {
                const { index } = data
                // Toggle: se clicar no mesmo ponto, esconde. Se clicar em outro, mostra
                setSelectedPointIndex(selectedPointIndex === index ? null : index)
              }}
              decorator={() => {
                if (selectedPointIndex === null) return null
                
                const value = chartData.datasets[0].data[selectedPointIndex]
                const index = selectedPointIndex
                const x = (index * ((screenWidth - 64 - 32) / (chartData.datasets[0].data.length - 1))) + 16
                const maxValue = Math.max(...chartData.datasets[0].data)
                const minValue = Math.min(...chartData.datasets[0].data)
                const range = maxValue - minValue || 1
                const percentage = (value - minValue) / range
                const y = 240 - 45 - (percentage * (240 - 85)) // Ajustado para altura 240
                
                // Pega a data do ponto selecionado
                const timestamp = evolutionData?.evolution?.timestamps[selectedPointIndex]
                const date = timestamp ? new Date(timestamp) : null
                const dateStr = date 
                  ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
                  : ''
                
                return (
                  <View key={index}>
                    <View
                      style={{
                        position: 'absolute',
                        left: x - 50,
                        top: y - 50,
                        backgroundColor: stats.isPositive ? '#10b981' : '#ef4444',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 8,
                        minWidth: 100,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#ffffff',
                          textAlign: 'center',
                        }}
                      >
                        {formatValue(value)}
                      </Text>
                      {dateStr && (
                        <Text
                          style={{
                            fontSize: 9,
                            color: '#ffffff',
                            opacity: 0.8,
                            marginTop: 2,
                            textAlign: 'center',
                          }}
                        >
                          {dateStr}
                        </Text>
                      )}
                    </View>
                  </View>
                )
              }}
            />
            
            {/* Overlay de loading durante troca de período */}
            {isChangingPeriod && (
              <View style={styles.loadingOverlay}>
                <AnimatedLogoIcon size={48} />
                <Text style={[styles.loadingText, { color: '#ffffff' }]}>
                  Carregando dados...
                </Text>
              </View>
            )}
          </View>
          )}
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  )
})

const styles = StyleSheet.create({
  containerWrapper: {
    marginBottom: 16,
  },
  container: {
    borderRadius: 24,
    padding: 20,
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    gap: 8,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  periodButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  periodButtonText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.regular,
  },
  title: {
    fontSize: typography.h4,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  changeText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  changeValue: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.medium,
  },
  hint: {
    fontSize: typography.tiny,
    fontStyle: "italic",
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
  },
  chartWrapper: {
    position: "relative",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    gap: 12,
  },
  loadingContainer: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: typography.body,
    marginTop: 12,
  },
  errorContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: typography.body,
    textAlign: "center",
  },
})
