import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { memo, useMemo } from 'react'
import Svg, { Line, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg'
import { useTheme } from '@/contexts/ThemeContext'
import { usePortfolio } from '@/contexts/PortfolioContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { typography, fontWeights } from '@/lib/typography'

const { width } = Dimensions.get('window')
const CHART_WIDTH = width - 48 // padding de 24 de cada lado
const CHART_HEIGHT = 120
const PADDING = 8

interface ChartPoint {
  x: number
  y: number
  value: number
  timestamp: string
}

export const PortfolioChart = memo(function PortfolioChart() {
  const { colors, isDark } = useTheme()
  const { evolutionData } = usePortfolio()
  const { hideValue } = usePrivacy()

  // Processa os dados do gráfico
  const chartData = useMemo((): ChartPoint[] => {
    if (!evolutionData?.evolution?.values_usd || evolutionData.evolution.values_usd.length === 0) {
      return []
    }

    const values = evolutionData.evolution.values_usd
    const timestamps = evolutionData.evolution.timestamps

    // Encontra valores min/max para normalização
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1 // evita divisão por zero

    // Mapeia para coordenadas do gráfico
    return values.map((value: number, index: number) => {
      const x = PADDING + (index / (values.length - 1)) * (CHART_WIDTH - 2 * PADDING)
      // Inverte Y porque SVG tem origem no topo
      const y = CHART_HEIGHT - PADDING - ((value - minValue) / range) * (CHART_HEIGHT - 2 * PADDING)
      
      return {
        x,
        y,
        value,
        timestamp: timestamps[index]
      }
    })
  }, [evolutionData])

  // Gera o path SVG para a linha
  const linePath = useMemo(() => {
    if (chartData.length === 0) return ''
    
    let path = `M ${chartData[0].x} ${chartData[0].y}`
    
    // Usa curvas suaves (cubic bezier) para conectar os pontos
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1]
      const curr = chartData[i]
      
      const cpx1 = prev.x + (curr.x - prev.x) / 3
      const cpy1 = prev.y
      const cpx2 = prev.x + 2 * (curr.x - prev.x) / 3
      const cpy2 = curr.y
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
    }
    
    return path
  }, [chartData])

  // Gera o path para o gradiente de preenchimento
  const areaPath = useMemo(() => {
    if (chartData.length === 0) return ''
    
    let path = linePath
    
    // Completa o path descendo até a base e voltando
    const lastPoint = chartData[chartData.length - 1]
    const firstPoint = chartData[0]
    
    path += ` L ${lastPoint.x} ${CHART_HEIGHT}`
    path += ` L ${firstPoint.x} ${CHART_HEIGHT}`
    path += ' Z'
    
    return path
  }, [linePath, chartData])

  // Determina se o gráfico está positivo ou negativo
  const isPositive = useMemo(() => {
    if (chartData.length < 2) return true
    return chartData[chartData.length - 1].value >= chartData[0].value
  }, [chartData])

  // Cor do gráfico baseada na tendência
  const lineColor = isPositive ? colors.success : colors.danger

  if (chartData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? 'rgba(38, 38, 38, 0.5)' : 'rgba(248, 248, 248, 1)' }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Sem dados de evolução
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(38, 38, 38, 0.5)' : 'rgba(248, 248, 248, 1)' }]}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Área preenchida com gradiente */}
        <Path
          d={areaPath}
          fill="url(#areaGradient)"
        />
        
        {/* Linha do gráfico */}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Ponto inicial */}
        <Circle
          cx={chartData[0].x}
          cy={chartData[0].y}
          r={3}
          fill={lineColor}
          opacity={0.7}
        />
        
        {/* Ponto final (maior) */}
        <Circle
          cx={chartData[chartData.length - 1].x}
          cy={chartData[chartData.length - 1].y}
          r={4}
          fill={lineColor}
        />
      </Svg>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.regular,
    opacity: 0.7,
  },
})
