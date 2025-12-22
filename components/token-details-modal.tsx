import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { apiService } from "@/services/api"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"
import { config } from "@/lib/config"

interface TokenDetailsModalProps {
  visible: boolean
  onClose: () => void
  exchangeId: string
  symbol: string
}

interface TokenDetails {
  symbol: string
  pair: string
  quote: string
  exchange: {
    id: string
    name: string
    ccxt_id: string
  }
  price: {
    current: string
    bid: string
    ask: string
    high_24h: string
    low_24h: string
  }
  change: {
    "1h": {
      price_change: string
      price_change_percent: string
    }
    "4h": {
      price_change: string
      price_change_percent: string
    }
    "24h": {
      price_change: string
      price_change_percent: string
    }
  }
  volume: {
    base_24h: string
    quote_24h: string
  }
  market_info: {
    active: boolean
    limits: {
      amount: {
        min: number | null
        max: number | null
      }
      cost: {
        min: number | null
        max: number | null
      }
      price: {
        min: number | null
        max: number | null
      }
      leverage?: {
        min: number | null
        max: number | null
      }
    }
    precision: {
      amount: number
      price: number
    }
  }
  timestamp: number
  datetime: string
}

export function TokenDetailsModal({ visible, onClose, exchangeId, symbol }: TokenDetailsModalProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenData, setTokenData] = useState<TokenDetails | null>(null)

  useEffect(() => {
    if (visible && exchangeId && symbol) {
      loadTokenDetails()
    }
  }, [visible, exchangeId, symbol])

  const loadTokenDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `${config.apiBaseUrl}/exchanges/${exchangeId}/token/${symbol}?user_id=${config.userId}&include_variations=true`
      )
      
      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes do token')
      }
      
      const data = await response.json()
      setTokenData(data)
    } catch (err: any) {
      console.error('❌ Erro ao carregar token:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: string | number | null) => {
    if (!price) return 'N/A'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    
    // Se o preço for muito pequeno (< 0.01), usa notação científica
    if (numPrice < 0.01) {
      return numPrice.toFixed(10).replace(/\.?0+$/, '')
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(numPrice)
  }

  const formatVolume = (volume: string | number | null) => {
    if (!volume) return 'N/A'
    const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume
    
    if (numVolume >= 1_000_000_000) {
      return `${(numVolume / 1_000_000_000).toFixed(2)}B`
    }
    if (numVolume >= 1_000_000) {
      return `${(numVolume / 1_000_000).toFixed(2)}M`
    }
    if (numVolume >= 1_000) {
      return `${(numVolume / 1_000).toFixed(2)}K`
    }
    return numVolume.toFixed(2)
  }

  const formatPercent = (percent: string | number | null) => {
    if (!percent) return 'N/A'
    const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent
    const sign = numPercent >= 0 ? '+' : ''
    return `${sign}${numPercent.toFixed(2)}%`
  }

  const getChangeColor = (percent: string | number | null) => {
    if (!percent) return colors.textSecondary
    const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent
    return numPercent >= 0 ? '#10b981' : '#ef4444'
  }

  const getBidAskColor = (type: 'bid' | 'ask') => {
    return type === 'bid' ? '#10b981' : '#ef4444'
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateSpread = (bid: string, ask: string) => {
    const bidNum = parseFloat(bid)
    const askNum = parseFloat(ask)
    if (!bidNum || !askNum) return 'N/A'
    
    const spread = ((askNum - bidNum) / bidNum) * 100
    return `${spread.toFixed(4)}%`
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.safeArea}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {tokenData ? `${symbol} - ${tokenData.exchange.name}` : t('token.details')}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <AnimatedLogoIcon size={40} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {t('common.loading')}
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: '#ef4444' }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={loadTokenDetails}
                >
                  <Text style={styles.retryButtonText}>{t('common.refresh')}</Text>
                </TouchableOpacity>
              </View>
            ) : tokenData ? (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Preço Atual */}
                <View style={[styles.section, { backgroundColor: colors.background }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {t('token.currentPrice')}
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.text }]}>
                    {formatPrice(tokenData.price.current)}
                  </Text>
                  <Text style={[styles.pairText, { color: colors.textSecondary }]}>
                    {tokenData.pair}
                  </Text>
                </View>

                {/* Variações de Preço */}
                <View style={[styles.section, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('token.priceVariation')}
                  </Text>
                  <View style={styles.changeContainer}>
                    <View style={styles.changeItem}>
                      <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>
                        1h
                      </Text>
                      <Text
                        style={[
                          styles.changeValue,
                          { color: getChangeColor(tokenData.change['1h']?.price_change_percent) },
                        ]}
                      >
                        {formatPercent(tokenData.change['1h']?.price_change_percent)}
                      </Text>
                    </View>
                    <View style={styles.changeItem}>
                      <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>
                        4h
                      </Text>
                      <Text
                        style={[
                          styles.changeValue,
                          { color: getChangeColor(tokenData.change['4h']?.price_change_percent) },
                        ]}
                      >
                        {formatPercent(tokenData.change['4h']?.price_change_percent)}
                      </Text>
                    </View>
                    <View style={styles.changeItem}>
                      <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>
                        24h
                      </Text>
                      <Text
                        style={[
                          styles.changeValue,
                          { color: getChangeColor(tokenData.change['24h']?.price_change_percent) },
                        ]}
                      >
                        {formatPercent(tokenData.change['24h']?.price_change_percent)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Máxima e Mínima 24h */}
                <View style={[styles.section, { borderBottomColor: colors.cardBorder }]}>
                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('token.high24h')}
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {formatPrice(tokenData.price.high_24h)}
                      </Text>
                    </View>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('token.low24h')}
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {formatPrice(tokenData.price.low_24h)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Volume 24h */}
                <View style={[styles.section, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('token.volume24h')}
                  </Text>
                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {tokenData.symbol}
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {formatVolume(tokenData.volume.base_24h)}
                      </Text>
                    </View>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {tokenData.quote}
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {formatVolume(tokenData.volume.quote_24h)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Preços Bid/Ask */}
                <View style={[styles.section, { borderBottomColor: colors.cardBorder }]}>
                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('token.bidPrice')}
                      </Text>
                      <Text style={[styles.value, { color: getBidAskColor('bid') }]}>
                        {formatPrice(tokenData.price.bid)}
                      </Text>
                    </View>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('token.askPrice')}
                      </Text>
                      <Text style={[styles.value, { color: getBidAskColor('ask') }]}>
                        {formatPrice(tokenData.price.ask)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.spreadRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                      {t('token.spread')}:
                    </Text>
                    <Text style={[styles.value, { color: colors.text }]}>
                      {calculateSpread(tokenData.price.bid, tokenData.price.ask)}
                    </Text>
                  </View>
                </View>

                {/* Informações de Mercado */}
                <View style={[styles.section, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {t('token.marketInfo')}
                  </Text>
                  
                  {/* Limites */}
                  <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                    {t('token.limits')}
                  </Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        {t('token.minAmount')}
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {tokenData.market_info.limits.amount.min !== null
                          ? formatVolume(tokenData.market_info.limits.amount.min)
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        {t('token.maxAmount')}
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {tokenData.market_info.limits.amount.max !== null
                          ? formatVolume(tokenData.market_info.limits.amount.max)
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        {t('token.minCost')}
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {tokenData.market_info.limits.cost.min !== null
                          ? formatPrice(tokenData.market_info.limits.cost.min)
                          : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        {t('token.maxCost')}
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {tokenData.market_info.limits.cost.max !== null
                          ? formatPrice(tokenData.market_info.limits.cost.max)
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Precisão */}
                  <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                    {t('token.precision')}
                  </Text>
                  <View style={styles.row}>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('token.amountPrecision')}
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {tokenData.market_info.precision.amount}
                      </Text>
                    </View>
                    <View style={styles.halfColumn}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {t('token.pricePrecision')}
                      </Text>
                      <Text style={[styles.value, { color: colors.text }]}>
                        {tokenData.market_info.precision.price}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Última Atualização */}
                <View style={[styles.section, { marginBottom: 20 }]}>
                  <Text style={[styles.lastUpdate, { color: colors.textSecondary }]}>
                    {t('token.lastUpdate')}: {formatDateTime(tokenData.timestamp)}
                  </Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  modalContent: {
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '300',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 16,
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 4,
  },
  pairText: {
    fontSize: 14,
    fontWeight: '300',
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  changeItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '300',
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '300',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '400',
  },
  spreadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '48%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '300',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  lastUpdate: {
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
  },
})
