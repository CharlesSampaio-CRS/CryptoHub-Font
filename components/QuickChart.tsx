import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableWithoutFeedback } from "react-native"
import { memo, useState } from "react"
import { LineChart } from "react-native-chart-kit"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { usePortfolio } from "@/contexts/PortfolioContext"
import { SkeletonChart } from "./SkeletonLoaders"

const screenWidth = Dimensions.get("window").width

export const QuickChart = memo(function QuickChart() {
  const { t } = useLanguage()
  const { colors, isDark } = useTheme()
  const { evolutionData, loading, error } = usePortfolio()
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
    
    // Formata labels (últimos 3 caracteres da data/hora)
    const labels = timestamps.map(ts => {
      const date = new Date(ts)
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    })

    return {
      labels: labels.length > 7 ? labels.slice(-7) : labels,
      datasets: [
        {
          data: values_usd.length > 7 ? values_usd.slice(-7) : values_usd,
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
          height={220}
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
              r: "6",
              strokeWidth: "3",
              stroke: isDark ? "#ffffff" : "#3b82f6", // Branco no dark mode : Blue 500 no light mode
              fill: isDark ? "#ffffff" : "#3b82f6", // Preenchimento branco no dark mode
            },
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: isDark ? "rgba(71, 85, 105, 0.3)" : "#e3f2fd", // Slate 600 low opacity : Light blue
              strokeWidth: 1,
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
          formatYLabel={(value) => `$${parseInt(value)}`}
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
            const y = 220 - 40 - (percentage * (220 - 80)) // Ajustado para altura 220
            
            return (
              <View key={index}>
                <Text
                  style={{
                    position: 'absolute',
                    left: x - 25,
                    top: y - 30,
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#ffffff',
                    backgroundColor: isDark ? '#3b82f6' : '#2563eb',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  ${value.toFixed(2)}
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
