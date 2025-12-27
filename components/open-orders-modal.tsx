import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Alert } from "react-native"
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
  onOrderCancelled?: () => void  // Callback chamado após cancelar ordem
}

export function OpenOrdersModal({ 
  visible, 
  onClose, 
  exchangeId, 
  exchangeName,
  userId,
  onSelectOrder,
  onOrderCancelled
}: OpenOrdersModalProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [orders, setOrders] = useState<OpenOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<OpenOrder | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [confirmCancelAllVisible, setConfirmCancelAllVisible] = useState(false)
  const [cancellingAll, setCancellingAll] = useState(false)
  const [menuOpenForOrderId, setMenuOpenForOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (visible && exchangeId) {
      loadOrders()
    }
  }, [visible, exchangeId])

  const loadOrders = async () => {
    console.log('🔄 Buscando ordens abertas para', exchangeName, 'sem cache...')
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getOpenOrders(userId, exchangeId)
      
      // Verifica flags de erro (graceful degradation do backend)
      const hasError = response.error || response.auth_error || response.exchange_error || 
                      response.network_error || response.rate_limited
      
      if (hasError) {
        const errorMessage = response.message || 'Erro ao buscar ordens'
        console.warn('⚠️  API retornou erro (graceful):', errorMessage)
        
        // Se for erro de autenticação, mostre mensagem específica
        if (response.auth_error) {
          setError('Erro de autenticação. Verifique suas credenciais da exchange.')
        } else if (response.not_supported) {
          setError('Esta exchange não suporta consulta de ordens abertas.')
        } else if (response.rate_limited) {
          setError('Limite de requisições atingido. Aguarde alguns segundos.')
        } else {
          setError(errorMessage)
        }
        
        setOrders([])
        setLastUpdate(new Date())
        return
      }
      
      const fetchedOrders = response.orders || []
      
      setOrders(fetchedOrders)
      setLastUpdate(new Date())
      
      console.log('✅ Ordens carregadas:', fetchedOrders.length, 'ordens encontradas')
    } catch (err: any) {
      console.error('❌ Erro ao carregar ordens:', err)
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

  const handleCancelOrder = async (order: OpenOrder) => {
    // Abre o modal de confirmação
    setOrderToCancel(order)
    setConfirmCancelVisible(true)
  }

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return
    
    setConfirmCancelVisible(false)
    setCancellingOrderId(orderToCancel.id) // Marca ordem como sendo cancelada
    
    try {
      console.log('📋 [OpenOrdersModal] 🔄 Cancelando ordem:', orderToCancel.id)
      console.log('📋 [OpenOrdersModal] 📋 Dados:', { userId, exchangeId, orderId: orderToCancel.id, symbol: orderToCancel.symbol })
      
      // Chama a API para cancelar (com exchange_id e symbol)
      console.log('📋 [OpenOrdersModal] 🌐 Chamando apiService.cancelOrder...')
      const result = await apiService.cancelOrder(userId, orderToCancel.id, exchangeId, orderToCancel.symbol)
      console.log('📋 [OpenOrdersModal] 📥 Resultado recebido:', result)
      
      if (result.success) {
        console.log('✅ [OpenOrdersModal] Ordem cancelada com sucesso!')
        
        // Fecha o modal IMEDIATAMENTE para feedback visual rápido
        console.log('📋 [OpenOrdersModal] 🚪 Fechando modal...')
        onClose()
        
        // Cache removido: consulta sempre fresca
        
        // Atualiza APENAS a exchange específica desta ordem (via função global exposta por ExchangesList)
        console.log('📋 [OpenOrdersModal] ⚡ Atualizando exchange específica:', exchangeId)
        if (typeof (window as any).__exchangesListRefreshOrdersForExchange === 'function') {
          await (window as any).__exchangesListRefreshOrdersForExchange(exchangeId)
        }
        
        // Chama callback para atualizar lista de tokens
        if (onOrderCancelled) {
          console.log('📋 [OpenOrdersModal] 🔄 Chamando callback onOrderCancelled...')
          onOrderCancelled()
        }
        
        // Notifica sucesso
        Alert.alert('Sucesso', '✅ Ordem cancelada com sucesso!')
      } else {
        console.error('❌ [OpenOrdersModal] API retornou success=false:', result)
        throw new Error(result.error || 'Erro ao cancelar ordem')
      }
    } catch (error: any) {
      console.error('❌ [OpenOrdersModal] Erro ao cancelar:', error)
      console.error('❌ [OpenOrdersModal] Stack:', error.stack)
      Alert.alert('Erro', `❌ Erro ao cancelar ordem: ${error.message}`)
    } finally {
      setOrderToCancel(null)
      setCancellingOrderId(null) // Remove loading
    }
  }

  const handleCancelAllOrders = () => {
    // Abre o modal de confirmação
    setConfirmCancelAllVisible(true)
  }

  const confirmCancelAllOrders = async () => {
    setConfirmCancelAllVisible(false)
    setCancellingAll(true)
    
    try {
      console.log('📋 [OpenOrdersModal] 🔄 Cancelando TODAS as ordens da exchange:', exchangeId)
      
      // Chama a API para cancelar todas
      const result = await apiService.cancelAllOrders(userId, exchangeId)
      console.log('📋 [OpenOrdersModal] 📥 Resultado recebido:', result)
      
      if (result.success) {
        console.log('✅ [OpenOrdersModal] Todas as ordens canceladas com sucesso!')
        
        // Fecha o modal IMEDIATAMENTE
        console.log('📋 [OpenOrdersModal] 🚪 Fechando modal...')
        onClose()
        
        // Cache removido: consulta sempre fresca
        
        // Atualiza a exchange
        console.log('📋 [OpenOrdersModal] ⚡ Atualizando exchange específica:', exchangeId)
        if (typeof (window as any).__exchangesListRefreshOrdersForExchange === 'function') {
          await (window as any).__exchangesListRefreshOrdersForExchange(exchangeId)
        }
        
        // Chama callback
        if (onOrderCancelled) {
          console.log('📋 [OpenOrdersModal] 🔄 Chamando callback onOrderCancelled...')
          onOrderCancelled()
        }
        
        // Notifica sucesso com informações
        const cancelledCount = result.cancelled_count || result.cancelledCount || 0
        Alert.alert('Sucesso', `✅ ${cancelledCount} ordem(ns) cancelada(s) com sucesso!`)
      } else {
        console.error('❌ [OpenOrdersModal] API retornou success=false:', result)
        throw new Error(result.error || 'Erro ao cancelar ordens')
      }
    } catch (error: any) {
      console.error('❌ [OpenOrdersModal] Erro ao cancelar todas:', error)
      Alert.alert('Erro', `❌ Erro ao cancelar ordens: ${error.message}`)
    } finally {
      setCancellingAll(false)
    }
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
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
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
                        // Sempre busca dados frescos
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
                
                {/* Botão Cancelar Todas */}
                {orders.length > 0 && !loading && (
                  <TouchableOpacity 
                    onPress={handleCancelAllOrders}
                    style={[styles.cancelAllButton, { backgroundColor: '#ef4444' + '15', borderColor: '#ef4444' + '40' }]}
                    disabled={cancellingAll}
                  >
                    {cancellingAll ? (
                      <AnimatedLogoIcon size={14} />
                    ) : (
                      <Text style={[styles.cancelAllButtonText, { color: '#ef4444' }]}>
                        {t('orders.cancelAll')}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>
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
                    <View
                      key={order.id}
                      style={[styles.orderItemCompact, { 
                        backgroundColor: colors.surface,
                        borderBottomColor: colors.border 
                      }]}
                    >
                      <View style={styles.orderCompactRow}>
                        {/* Symbol - clicável para abrir detalhes */}
                        <TouchableOpacity
                          onPress={() => {
                            console.log('📋 [OpenOrdersModal] Ordem selecionada:', order.id)
                            onSelectOrder(order)
                            onClose()
                          }}
                          activeOpacity={0.7}
                          style={styles.symbolContainer}
                        >
                          <Text style={[styles.orderSymbolCompact, { color: colors.text }]} numberOfLines={1}>
                            {order.symbol.toLowerCase()}
                          </Text>
                        </TouchableOpacity>

                        {/* Side (Buy/Sell) */}
                        <View style={[styles.orderSideBadgeCompact, { backgroundColor: getSideColor(order.side) + '10' }]}>
                          <Text style={[styles.orderSideTextCompact, { color: getSideColor(order.side) }]}>
                            {getSideLabel(order.side)}
                          </Text>
                        </View>

                        {/* Values container */}
                        <View style={styles.valuesContainer}>
                          {/* Amount */}
                          <Text style={[styles.orderAmountCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                            {formatAmount(order.amount)}
                          </Text>

                          {/* Price */}
                          <Text style={[styles.orderPriceCompact, { color: colors.textSecondary }]} numberOfLines={1}>
                            {formatValue(order.price)}
                          </Text>
                        </View>

                        {/* Actions container */}
                        <View style={styles.actionsContainer}>
                          {/* Status badge (se parcialmente preenchida) */}
                          {order.filled > 0 && (
                            <View style={[styles.orderStatusBadgeCompact, { backgroundColor: '#f59e0b' + '10' }]}>
                              <Text style={[styles.orderStatusTextCompact, { color: '#f59e0b' }]}>
                                {((order.filled / order.amount) * 100).toFixed(0)}%
                              </Text>
                            </View>
                          )}

                          {/* Menu Button (3 dots) */}
                          <View>
                            <TouchableOpacity
                              onPress={() => setMenuOpenForOrderId(menuOpenForOrderId === order.id ? null : order.id)}
                              style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            >
                              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: fontWeights.bold, lineHeight: 16 }}>
                                ⋮
                              </Text>
                            </TouchableOpacity>

                            {/* Dropdown Menu */}
                            {menuOpenForOrderId === order.id && (
                              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <TouchableOpacity
                                  onPress={() => {
                                    setMenuOpenForOrderId(null)
                                    handleCancelOrder(order)
                                  }}
                                  style={styles.dropdownItem}
                                >
                                  <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>
                                    {t('orders.cancel')}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>

      {/* Modal de Confirmação de Cancelamento */}
      <Modal
        visible={confirmCancelVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmCancelVisible(false)}
      >
        <Pressable 
          style={styles.confirmOverlay} 
          onPress={() => setConfirmCancelVisible(false)}
        >
          <Pressable 
            style={styles.confirmSafeArea} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.confirmContainer, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={[styles.confirmHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  Confirmar Cancelamento
                </Text>
              </View>

              {/* Content */}
              <View style={styles.confirmContent}>
                <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                  {orderToCancel && `Deseja realmente cancelar esta ordem ${orderToCancel.side === 'buy' ? 'de compra' : 'de venda'}?`}
                </Text>
                
                {orderToCancel && (
                  <View style={[styles.confirmDetails, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Par:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {orderToCancel.symbol}
                      </Text>
                    </View>
                    
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Lado:
                      </Text>
                      <Text style={[styles.confirmValue, { color: getSideColor(orderToCancel.side) }]}>
                        {getSideLabel(orderToCancel.side)}
                      </Text>
                    </View>
                    
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Quantidade:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {formatAmount(orderToCancel.amount)}
                      </Text>
                    </View>
                    
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Preço:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {formatValue(orderToCancel.price)}
                      </Text>
                    </View>
                    
                    <View style={[styles.confirmDetailRow, styles.confirmTotalRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary, fontWeight: fontWeights.semibold }]}>
                        Total:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text, fontWeight: fontWeights.semibold }]}>
                        {formatValue(orderToCancel.amount * orderToCancel.price)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Footer com botões */}
              <View style={styles.confirmFooter}>
                <TouchableOpacity
                  onPress={() => {
                    setConfirmCancelVisible(false)
                    setOrderToCancel(null)
                  }}
                  style={[styles.confirmButton, styles.confirmButtonCancel, { borderColor: colors.border }]}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.textSecondary }]}>
                    Voltar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={confirmCancelOrder}
                  style={[styles.confirmButton, styles.confirmButtonConfirm, { backgroundColor: '#ef4444' }]}
                >
                  <Text style={[styles.confirmButtonText, { color: '#fff' }]}>
                    Cancelar Ordem
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Confirmação de Cancelar Todas */}
      <Modal
        visible={confirmCancelAllVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmCancelAllVisible(false)}
      >
        <Pressable 
          style={styles.confirmOverlay} 
          onPress={() => setConfirmCancelAllVisible(false)}
        >
          <Pressable 
            style={styles.confirmSafeArea} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.confirmContainer, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={[styles.confirmHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  {t('orders.cancelAllTitle')}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.confirmContent}>
                <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                  {t('orders.cancelAllMessage').replace('{count}', String(orders.length))}
                </Text>
                
                <View style={[styles.confirmWarning, { backgroundColor: '#ef4444' + '10', borderColor: '#ef4444' + '40' }]}>
                  <Text style={[styles.confirmWarningText, { color: '#ef4444' }]}>
                    {t('orders.cancelAllWarning')}
                  </Text>
                </View>
              </View>

              {/* Footer com botões */}
              <View style={styles.confirmFooter}>
                <TouchableOpacity
                  onPress={() => setConfirmCancelAllVisible(false)}
                  style={[styles.confirmButton, styles.confirmButtonCancel, { borderColor: colors.border }]}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.textSecondary }]}>
                    {t('orders.cancelAllNo')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={confirmCancelAllOrders}
                  style={[styles.confirmButton, styles.confirmButtonConfirm, { backgroundColor: '#ef4444' }]}
                >
                  <Text style={[styles.confirmButtonText, { color: '#fff' }]}>
                    Cancelar Todas
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    fontSize: typography.h3,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingTop: 2,
  },
  cancelAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelAllButtonText: {
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
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
  // Compact list styles (similar to tokens list)
  orderItemCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
  },
  orderCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbolContainer: {
    minWidth: 80,
  },
  orderSymbolCompact: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.semibold,
  },
  orderSideBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 36,
  },
  orderSideTextCompact: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  valuesContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  orderAmountCompact: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.regular,
    minWidth: 60,
    textAlign: 'right',
  },
  orderPriceCompact: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.regular,
    minWidth: 60,
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderStatusBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 36,
  },
  orderStatusTextCompact: {
    fontSize: typography.tiny,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  menuButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: typography.body,
    fontWeight: fontWeights.medium,
  },
  cancelButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Estilos do modal de confirmação
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmSafeArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  confirmContainer: {
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmHeader: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: typography.h3,
    fontWeight: fontWeights.semibold,
  },
  confirmContent: {
    padding: 20,
    gap: 16,
  },
  confirmMessage: {
    fontSize: typography.body,
    textAlign: "center",
    lineHeight: 20,
  },
  confirmWarning: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  confirmWarningText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.medium,
    textAlign: "center",
  },
  confirmDetails: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  confirmDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmTotalRow: {
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  confirmLabel: {
    fontSize: typography.bodySmall,
  },
  confirmValue: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.medium,
  },
  confirmFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonCancel: {
    borderWidth: 1,
  },
  confirmButtonConfirm: {
    // backgroundColor definido inline
  },
  confirmButtonText: {
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
})
