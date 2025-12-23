import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from "react-native"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { typography, fontWeights } from "../lib/typography"
import { OpenOrder } from "../types/orders"
import { apiService } from "../services/api"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"

interface OpenOrdersModalProps {
  visible: boolean
  onClose: () => void
  exchangeId: string
  exchangeName: string
  userId: string
  onSelectOrder: (order: OpenOrder) => void
}

// Cache global para ordens abertas
const ordersCache = new Map<string, { orders: OpenOrder[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos em milissegundos

export function OpenOrdersModal({ 
  visible, 
  onClose, 
  exchangeId, 
  exchangeName,
  userId,
  onSelectOrder 
}: OpenOrdersModalProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [orders, setOrders] = useState<OpenOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (visible && exchangeId) {
      loadOrders()
    }
  }, [visible, exchangeId])

  const loadOrders = async () => {
    const cacheKey = `${userId}_${exchangeId}`
    const cached = ordersCache.get(cacheKey)
    const now = Date.now()

    // Verifica se tem cache válido (menos de 5 minutos)
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('📋 [OpenOrdersModal] ⚡ Usando cache para', exchangeName, '(válido por', 
        Math.round((CACHE_DURATION - (now - cached.timestamp)) / 1000), 'segundos)')
      setOrders(cached.orders)
      setLastUpdate(new Date(cached.timestamp))
      return
    }

    // Cache expirado ou não existe, busca da API
    console.log('📋 [OpenOrdersModal] 🔄 Cache expirado ou não existe, buscando da API para', exchangeName)
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getOpenOrders(userId, exchangeId)
      const fetchedOrders = response.orders || []
      
      // Salva no cache
      const updateTime = Date.now()
      ordersCache.set(cacheKey, { 
        orders: fetchedOrders, 
        timestamp: updateTime 
      })
      
      setOrders(fetchedOrders)
      setLastUpdate(new Date(updateTime))
      
      console.log('📋 [OpenOrdersModal] ✅ Cache atualizado para', exchangeName, '-', fetchedOrders.length, 'ordens')
    } catch (err: any) {
      console.error('📋 [OpenOrdersModal] ❌ Erro:', err)
      setError(err.message || 'Erro ao carregar ordens')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'limit': return '#3b82f6'
      case 'market': return '#10b981'
      case 'stop_loss': return '#ef4444'
      case 'stop_loss_limit': return '#f59e0b'
      default: return colors.textSecondary
    }
  }

  const getSideColor = (side: string) => {
    return side === 'buy' ? '#10b981' : '#ef4444'
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'limit': return t('orders.type.limit')
      case 'market': return t('orders.type.market')
      case 'stop_loss': return t('orders.type.stopLoss')
      default: return type.toUpperCase()
    }
  }

  const getSideLabel = (side: string) => {
    return side === 'buy' ? t('orders.side.buy') : t('orders.side.sell')
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    } else if (value >= 1) {
      return `$${value.toFixed(2)}`
    } else {
      // Para valores muito pequenos (como 0.0026484), mostrar mais casas decimais
      return `$${value.toFixed(8).replace(/\.?0+$/, '')}`
    }
  }

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`
    } else if (amount >= 1) {
      return amount.toFixed(2)
    } else {
      return amount.toFixed(8).replace(/\.?0+$/, '')
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = () => {
    if (!lastUpdate) return ''
    
    const timeStr = lastUpdate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
    
    return `${t('portfolio.updatedAt')}: ${timeStr}`
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSafeArea} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('orders.title')}
                </Text>
                <Text style={[styles.exchangeName, { color: colors.textSecondary }]}>
                  {exchangeName}
                </Text>
                {/* Info sobre atualização automática */}
                <View style={[styles.infoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoIconYellow}>i</Text>
                  </View>
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {t('orders.autoUpdate')}
                  </Text>
                </View>
                {lastUpdate && (
                  <View style={styles.updateContainer}>
                    <Text style={[styles.lastUpdateText, { color: colors.textSecondary }]}>
                      {getRelativeTime()}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => {
                        // Força atualização removendo do cache
                        const cacheKey = `${userId}_${exchangeId}`
                        ordersCache.delete(cacheKey)
                        loadOrders()
                      }}
                      style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
                      disabled={loading}
                      activeOpacity={loading ? 1 : 0.7}
                    >
                      {loading ? (
                        <AnimatedLogoIcon size={16} />
                      ) : (
                        <Text style={[styles.refreshIcon, { color: colors.primary }]}>↻</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.modalContent}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <AnimatedLogoIcon size={48} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {t('orders.loading')}
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.errorText, { color: '#ef4444' }]}>
                    {error}
                  </Text>
                  <TouchableOpacity onPress={loadOrders} style={styles.retryButton}>
                    <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                      {t('orders.retry')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : orders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>�</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Nenhuma ordem aberta
                  </Text>
                  <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                    Você não possui ordens abertas nesta exchange
                  </Text>
                </View>
              ) : (
                <View style={styles.ordersList}>
                  {orders.map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      style={[styles.orderCard, { 
                        backgroundColor: colors.surface,
                        borderColor: colors.border 
                      }]}
                      onPress={() => {
                        console.log('📋 [OpenOrdersModal] Ordem selecionada:', {
                          id: order.id,
                          symbol: order.symbol,
                          keys: Object.keys(order),
                          fullOrder: order
                        })
                        onSelectOrder(order)
                        onClose()
                      }}
                    >
                      {/* Header da ordem */}
                      <View style={styles.orderHeader}>
                        <View style={styles.orderSymbol}>
                          <Text style={[styles.symbolText, { color: colors.text }]}>
                            {order.symbol}
                          </Text>
                          <View style={[styles.typeBadge, { backgroundColor: getOrderTypeColor(order.type) + '20' }]}>
                            <Text style={[styles.typeText, { color: getOrderTypeColor(order.type) }]}>
                              {getOrderTypeLabel(order.type)}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.sideBadge, { backgroundColor: getSideColor(order.side) + '20' }]}>
                          <Text style={[styles.sideText, { color: getSideColor(order.side) }]}>
                            {getSideLabel(order.side)}
                          </Text>
                        </View>
                      </View>

                      {/* Detalhes */}
                      <View style={styles.orderDetails}>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            {t('orders.price')}
                          </Text>
                          <Text style={[styles.detailValue, { color: colors.text }]}>
                            {formatValue(order.price)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            {t('orders.amount')}
                          </Text>
                          <Text style={[styles.detailValue, { color: colors.text }]}>
                            {formatAmount(order.amount)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            {t('orders.filled')}
                          </Text>
                          <Text style={[styles.detailValue, { color: colors.text }]}>
                            {order.filled > 0 && order.amount > 0 ? ((order.filled / order.amount) * 100).toFixed(1) + '%' : '0%'}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                            {t('orders.total')}
                          </Text>
                          <Text style={[styles.detailValue, { color: colors.text }]}>
                            {formatValue(order.price * order.amount)}
                          </Text>
                        </View>
                      </View>

                      {/* Footer */}
                      <View style={styles.orderFooter}>
                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                          {formatDate(order.timestamp)}
                        </Text>
                        <Text style={[styles.totalText, { color: colors.text }]}>
                          {formatValue(order.cost)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSafeArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  modalContainer: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    height: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: typography.h2,
    fontWeight: fontWeights.medium,
  },
  exchangeName: {
    fontSize: typography.caption,
    fontWeight: fontWeights.light,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 0.5,
    opacity: 0.8,
  },
  infoIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFA500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconYellow: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: typography.micro,
    fontWeight: fontWeights.light,
    flex: 1,
    lineHeight: 14,
  },
  autoUpdateInfo: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.light,
    marginTop: 2,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  lastUpdateText: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.light,
    marginTop: 2,
    fontStyle: 'italic',
  },
  updateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: typography.h3,
    fontWeight: fontWeights.light,
    opacity: 0.7,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: typography.h1,
    fontWeight: fontWeights.light,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: typography.body,
    marginTop: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontWeight: fontWeights.medium,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: typography.body,
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    fontSize: typography.body,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
  },
  retryButtonText: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderSymbol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  symbolText: {
    fontSize: typography.h4,
    fontWeight: fontWeights.semibold,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.bold,
  },
  sideBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sideText: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.bold,
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: typography.bodySmall,
  },
  detailValue: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.medium,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  dateText: {
    fontSize: typography.caption,
  },
  totalText: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeights.semibold,
  },
})
