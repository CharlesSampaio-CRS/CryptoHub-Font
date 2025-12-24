import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback, Animated } from "react-native"
import { memo, useState, useEffect, useMemo, useRef } from "react"
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
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 15>(7) // Período padrão: 7 dias (removido 30)
  const [isChangingPeriod, setIsChangingPeriod] = useState(false)
  const [previousData, setPreviousData] = useState<any>(null)
  const opacityAnim = useRef(new Animated.Value(1)).current

  // Anima opacidade quando muda período
  useEffect(() => {
    if (isChangingPeriod) {
      Animated.timing(opacityAnim, {
        toValue: 0.4,
        duration: 200,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isChangingPeriod])

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
            // Força opacidade total para a linha
            return color
          },
          strokeWidth: 4,
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

  // Mostra skeleton apenas no loading inicial (sem dados anteriores)
  if (loading && !previousData) {
    return <SkeletonChart />
  }
  
  return (
    <TouchableWithoutFeedback onPress={() => setSelectedPointIndex(null)}>
      <View style={styles.containerWrapper}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.chartWrapper, { opacity: opacityAnim }]}>
            <LineChart
              data={chartData}
              width={screenWidth - 32}
              height={140}
              chartConfig={{
                backgroundColor: "transparent",
                backgroundGradientFrom: "transparent",
                backgroundGradientTo: "transparent",
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                fillShadowGradient: stats.isPositive ? '#10b981' : '#ef4444',
                fillShadowGradientOpacity: 0.6,
                fillShadowGradientTo: stats.isPositive ? '#10b981' : '#ef4444',
                fillShadowGradientToOpacity: 0.25,
                decimalPlaces: 0,
                color: (opacity = 1) => {
                  const baseColor = stats.isPositive ? '#10b981' : '#ef4444'
                  return baseColor
                },
                labelColor: (opacity = 1) => 'transparent',
                style: {
                  borderRadius: 0,
                },
                propsForDots: {
                  r: "0",
                },
                propsForBackgroundLines: {
                  strokeWidth: 0,
                },
                propsForLabels: {
                  fontSize: 1,
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLabels={false}
              withHorizontalLabels={false}
              withDots={false}
              withShadow={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              segments={3}
              formatYLabel={(value) => ''}
            />
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  )
})

const styles = StyleSheet.create({
  containerWrapper: {
    marginBottom: 0,
  },
  chart: {
    marginLeft: -16,
    borderRadius: 0,
  },
  chartWrapper: {
    position: "relative",
  },
  errorContainer: {
    height: 220, // 200→220
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24, // 20→24
  },
  errorText: {
    fontSize: typography.bodyLarge, // body→bodyLarge (17px)
    textAlign: "center",
    lineHeight: 24,
  },
})
