import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableWithoutFeedback } from "react-native"
import { memo, useState } from "react"
import { LineChart } from "react-native-chart-kit"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { SkeletonChart } from "./SkeletonLoaders"

const screenWidth = Dimensions.get("window").width

export const QuickChart = memo(function QuickChart() {
  const { t } = useLanguage()
  const { colors, isDark } = useTheme()
  const { evolutionData, loading, error } = usePortfolio()
  const { valuesHidden } = usePrivacy()
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)

  // Processa dados para o gráfico
  const getChartData = () => {
    if (!evolutionData?.evolution) {
      return {
        labels: [""],
        datasets: [{ data: [0] }],
      }
    }

    const { timestamps, values_usd } = evolutionData.evolution
    
    // Pega últimos 7 dias
    const last7Timestamps = timestamps.slice(-7)
    const last7Values = values_usd.slice(-7)
    
    // Formata labels para mobile - mostra apenas alguns para evitar sobreposição
    const labels = last7Timestamps.map((ts, index) => {
      const date = new Date(ts)
      const day = date.getDate()
      const month = date.getMonth() + 1
      
      // No mobile, mostra apenas primeiro, meio e último dia
      if (screenWidth < 400) {
        if (index === 0 || index === Math.floor(last7Timestamps.length / 2) || index === last7Timestamps.length - 1) {
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
          data: last7Values,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    }
  }

  const chartData = getChartData()
  
  if (loading) {
    return <SkeletonChart />
  }
  
  return (
    <TouchableWithoutFeedback onPress={() => setSelectedPointIndex(null)}>
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t('home.performance')}</Text>
        </View>

        {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      ) : (
        <LineChart
          data={chartData}
          width={screenWidth - 64}
          height={240}
          chartConfig={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            backgroundGradientFrom: isDark ? "#1e293b" : "#ffffff",
            backgroundGradientTo: isDark ? "#1e293b" : "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => isDark 
              ? `rgba(226, 232, 240, ${opacity})` // Slate 200 - cinza bem clarinho
              : `rgba(59, 130, 246, ${opacity})`, // Blue 500
            labelColor: (opacity = 1) => isDark
              ? `rgba(203, 213, 225, ${opacity})` // Slate 300
              : `rgba(100, 116, 139, ${opacity})`, // Slate 500
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "5",
              strokeWidth: "2",
              stroke: isDark ? "#ffffff" : "#3b82f6",
              fill: isDark ? "#ffffff" : "#3b82f6",
            },
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: isDark ? "rgba(71, 85, 105, 0.3)" : "#e3f2fd",
              strokeWidth: 1,
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
            
            // Formata valor do tooltip
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
            
            return (
              <View key={index}>
                <Text
                  style={{
                    position: 'absolute',
                    left: x - 30,
                    top: y - 35,
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#ffffff',
                    backgroundColor: isDark ? '#3b82f6' : '#2563eb',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  {formatValue(value)}
                </Text>
              </View>
            )
          }}
        />
      )}
      </View>
    </TouchableWithoutFeedback>
  )
})

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "400",
  },
  hint: {
    fontSize: 11,
    fontStyle: "italic",
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
})
