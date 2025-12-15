import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from "react-native"
import { memo, useEffect, useState } from "react"
import { LineChart } from "react-native-chart-kit"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { apiService } from "@/services/api"
import { config } from "@/lib/config"
import { PortfolioEvolutionResponse } from "@/types/api"

const screenWidth = Dimensions.get("window").width

export const QuickChart = memo(function QuickChart() {
  const { t } = useLanguage()
  const { colors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [evolutionData, setEvolutionData] = useState<PortfolioEvolutionResponse | null>(null)

  useEffect(() => {
    loadEvolutionData()
  }, [])

  const loadEvolutionData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getPortfolioEvolution(config.userId, 7)
      setEvolutionData(data)
    } catch (err: any) {
      console.error('❌ Error loading evolution data:', err)
      setError(err.message || 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

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
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('home.performance')}</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      ) : (
        <LineChart
          data={chartData}
        width={screenWidth - 64}
        height={200}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#3b82f6",
          },
          propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: "#e3f2fd",
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={false}
        withDots={true}
        withShadow={false}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "400",
    marginBottom: 16,
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
