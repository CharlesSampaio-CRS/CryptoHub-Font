import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native'
import { memo, useMemo, useState } from 'react'
import Svg, { G, Circle, Path } from 'react-native-svg'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useBalance } from '../contexts/BalanceContext'
import { usePrivacy } from '../contexts/PrivacyContext'
import { typography, fontWeights } from '../lib/typography'

const { width } = Dimensions.get('window')
const CHART_SIZE = Math.min(width - 80, 200) // 180→200
const RADIUS = CHART_SIZE / 2
const STROKE_WIDTH = 22 // 18→22

// Paleta de cores frias e harmoniosas (azuis, cinzas, tons gelados)
const EXCHANGE_COLORS = [
  '#3B82F6', // Azul vibrante
  '#60A5FA', // Azul claro
  '#6B7280', // Cinza médio
  '#93C5FD', // Azul céu
  '#9CA3AF', // Cinza claro
  '#7DD3FC', // Azul ciano claro
  '#475569', // Cinza escuro azulado
  '#A5B4FC', // Azul lavanda
  '#94A3B8', // Cinza azulado
  '#BAE6FD', // Azul muito claro
  '#64748B', // Cinza slate
  '#5EEAD4', // Turquesa suave
]

// Mapeamento de ícones das exchanges
const EXCHANGE_ICONS: Record<string, any> = {
  'Binance': require('../assets/binance.png'),
  'Bybit': require('../assets/bybit.png'),
  'Coinbase': require('../assets/coinbase.png'),
  'Gate.io': require('../assets/gateio.png'),
  'Kraken': require('../assets/kraken.png'),
  'KuCoin': require('../assets/kucoin.png'),
  'MEXC': require('../assets/mexc.png'),
  'NovaDAX': require('../assets/novadax.png'),
  'OKX': require('../assets/okx.png'),
}

interface ExchangeData {
  name: string
  value: number
  percentage: number
  color: string
}

export const ExchangesPieChart = memo(function ExchangesPieChart() {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const { data } = useBalance()
  const { valuesHidden } = usePrivacy()
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null)

  const chartData = useMemo(() => {
    if (!data || !data.exchanges) return []
    
    // Filtrar exchanges com saldo
    const exchangesWithBalance = data.exchanges.filter(
      (ex: any) => parseFloat(ex.total_usd) > 0
    )
    
    if (exchangesWithBalance.length === 0) return []

    // Calcular total
    const total = exchangesWithBalance.reduce(
      (sum: number, ex: any) => sum + parseFloat(ex.total_usd), 
      0
    )

    // Criar dados com porcentagem
    const chartDataItems: ExchangeData[] = exchangesWithBalance.map((ex: any, index: number) => ({
      name: ex.name,
      value: parseFloat(ex.total_usd),
      percentage: (parseFloat(ex.total_usd) / total) * 100,
      color: EXCHANGE_COLORS[index % EXCHANGE_COLORS.length],
    }))

    // Ordenar por valor decrescente
    return chartDataItems.sort((a, b) => b.value - a.value)
  }, [data])

  // Dados da exchange selecionada
  const selectedData = useMemo(() => {
    if (!selectedExchange) return null
    return chartData.find(item => item.name === selectedExchange)
  }, [selectedExchange, chartData])

  // Formatar valor USD
  const formatValue = (value: number) => {
    if (valuesHidden) return '••••••'
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  // Toggle seleção de exchange
  const toggleExchange = (exchangeName: string) => {
    setSelectedExchange(prev => prev === exchangeName ? null : exchangeName)
  }

  const pieSegments = useMemo(() => {
    if (chartData.length === 0) return []

    let currentAngle = -90 // Começar do topo

    return chartData.map((item) => {
      const angle = (item.percentage / 100) * 360
      const segment = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      }
      currentAngle += angle
      return segment
    })
  }, [chartData])

  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(0, 0, radius, endAngle)
    const end = polarToCartesian(0, 0, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ')
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  if (chartData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('home.distribution') || 'Por Exchange'}
          </Text>
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('home.noExchangesConnected') || 'Nenhuma exchange conectada'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('home.distribution') || 'Distribuição por Exchange'}
        </Text>

        <View style={styles.chartContainer}>
          {/* Gráfico de Pizza */}
          <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`${-RADIUS} ${-RADIUS} ${CHART_SIZE} ${CHART_SIZE}`}>
            <G>
              {pieSegments.map((segment, index) => {
                const isSelected = selectedExchange === segment.name
                const strokeWidth = isSelected ? STROKE_WIDTH + 4 : STROKE_WIDTH
                const opacity = selectedExchange && !isSelected ? 0.3 : 1
                
                return (
                  <Path
                    key={index}
                    d={createArc(segment.startAngle, segment.endAngle, RADIUS - strokeWidth / 2)}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    opacity={opacity}
                    onPress={() => toggleExchange(segment.name)}
                  />
                )
              })}
              {/* Círculo interno para criar efeito de donut */}
              <Circle
                r={RADIUS - STROKE_WIDTH - 4}
                fill={colors.card}
              />
            </G>
          </Svg>

          {/* Centro com texto */}
          <View style={styles.centerText}>
            {selectedData ? (
              <>
                <Text style={[styles.centerLabel, { color: colors.text }]} numberOfLines={1}>
                  {selectedData.name}
                </Text>
                <Text style={[styles.centerValue, { color: colors.primary }]}>
                  {formatValue(selectedData.value)}
                </Text>
                <Text style={[styles.centerPercentage, { color: colors.textSecondary }]}>
                  {selectedData.percentage.toFixed(1)}%
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.centerPercentage, { color: colors.textSecondary }]}>
                  100%
                </Text>
                <Text style={[styles.centerValue, { color: colors.text }]}>
                  {chartData.length === 1 ? 'Exchange' : 'Exchanges'}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Legenda */}
        <View style={styles.legend}>
          {chartData.map((item, index) => {
            const isSelected = selectedExchange === item.name
            const opacity = selectedExchange && !isSelected ? 0.4 : 1
            
            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.legendItem,
                  isSelected && { backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: 8, marginHorizontal: -8 }
                ]}
                onPress={() => toggleExchange(item.name)}
                activeOpacity={0.7}
              >
                {/* Ícone da Exchange */}
                {EXCHANGE_ICONS[item.name] ? (
                  <View style={[styles.exchangeIconContainer, { opacity }]}>
                    <Image 
                      source={EXCHANGE_ICONS[item.name]} 
                      style={styles.exchangeIcon}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={[styles.legendColor, { backgroundColor: item.color, opacity }]} />
                )}
                <View style={styles.legendTextContainer}>
                  <Text style={[styles.legendName, { color: colors.text, opacity }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.legendPercentage, { color: colors.textSecondary, opacity }]}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: item.color }]} />
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 28, // 24→28
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    gap: 20, // 16→20
  },
  title: {
    fontSize: typography.h3, // bodyLarge→h3 (20px)
    fontWeight: fontWeights.medium, // regular→medium
    letterSpacing: 0.3, // 0.2→0.3
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    paddingVertical: 10,
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: typography.display, // Mantém 32px
    fontWeight: fontWeights.regular, // light→regular
    letterSpacing: -1,
  },
  centerValue: {
    fontSize: typography.body, // caption→body (16px)
    fontWeight: fontWeights.medium, // regular→medium
    marginTop: 6, // 4→6
  },
  centerPercentage: {
    fontSize: typography.caption, // micro→caption (14px)
    fontWeight: fontWeights.medium, // regular→medium
    marginTop: 4, // 2→4
  },
  legend: {
    gap: 14, // 10→14
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 10→12
    minHeight: 44, // Touch target
    paddingVertical: 4,
  },
  exchangeIconContainer: {
    width: 32, // 22→32
    height: 32, // 22→32
    borderRadius: 16, // 11→16
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  exchangeIcon: {
    width: 28, // 20→28
    height: 28, // 20→28
  },
  legendColor: {
    width: 16, // 12→16
    height: 16, // 12→16
    borderRadius: 8, // 6→8
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  legendName: {
    fontSize: typography.body, // bodySmall→body (16px)
    fontWeight: fontWeights.medium, // regular→medium
    flex: 1,
  },
  legendPercentage: {
    fontSize: typography.body, // bodySmall→body (16px)
    fontWeight: fontWeights.medium, // regular→medium
    minWidth: 60,
    textAlign: 'right',
  },
  selectedIndicator: {
    width: 10, // 8→10
    height: 10, // 8→10
    borderRadius: 5, // 4→5
  },
  emptyState: {
    paddingVertical: 48, // 40→48
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.bodyLarge, // body→bodyLarge (17px)
    textAlign: 'center',
    lineHeight: 24,
  },
})
