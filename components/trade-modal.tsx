import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, Pressable } from 'react-native'
import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { typography, fontWeights } from '@/lib/typography'
import { apiService } from '@/services/api'
import { ordersCache } from '@/components/open-orders-modal'

interface TradeModalProps {
  visible: boolean
  onClose: () => void
  exchangeId: string
  exchangeName: string
  symbol: string
  currentPrice: number
  balance?: {
    token: number
    usdt: number
  }
  onOrderCreated?: () => void // Callback chamado após criar ordem com sucesso
}

type OrderType = 'market' | 'limit'
type OrderSide = 'buy' | 'sell'

export function TradeModal({ 
  visible, 
  onClose, 
  exchangeId, 
  exchangeName,
  symbol, 
  currentPrice,
  balance = { token: 0, usdt: 0 },
  onOrderCreated
}: TradeModalProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const [orderSide, setOrderSide] = useState<OrderSide>('buy')
  const [orderType, setOrderType] = useState<OrderType>('limit')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState(currentPrice < 0.01 ? currentPrice.toFixed(10).replace(/\.?0+$/, '') : currentPrice.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [marketLimits, setMarketLimits] = useState<{minAmount?: number, minCost?: number} | null>(null)
  const [confirmTradeVisible, setConfirmTradeVisible] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<{amount: number, price: number, total: number} | null>(null)

  // Busca limites do mercado (quantidade mínima, custo mínimo)
  useEffect(() => {
    const fetchMarketLimits = async () => {
      try {
        const data = await apiService.getMarkets(user?.id || 'charles_test_user', exchangeId, 'USDT', symbol)
        // Procura o par específico (ex: DOGE/USDT)
        const market = data?.markets?.find((m: any) => m.base === symbol && m.quote === 'USDT')
        if (market?.limits) {
          setMarketLimits({
            minAmount: market.limits.amount?.min,
            minCost: market.limits.cost?.min
          })
        }
      } catch (error) {
        console.error('Error fetching market limits:', error)
      }
    }
    
    if (visible && symbol && exchangeId) {
      fetchMarketLimits()
    }
  }, [visible, symbol, exchangeId, user?.id])

  // Atualiza o preço quando o preço atual muda
  useEffect(() => {
    if (orderType === 'market') {
      setPrice(currentPrice < 0.01 ? currentPrice.toFixed(10).replace(/\.?0+$/, '') : currentPrice.toString())
    }
  }, [currentPrice, orderType])

  // Reset ao abrir modal
  useEffect(() => {
    if (visible) {
      setOrderSide('buy')
      setOrderType('limit')
      setAmount('')
      setPrice(currentPrice < 0.01 ? currentPrice.toFixed(10).replace(/\.?0+$/, '') : currentPrice.toString())
    }
  }, [visible, currentPrice])

  const total = parseFloat(amount || '0') * parseFloat(price || '0')
  const isBuy = orderSide === 'buy'
  const availableBalance = isBuy ? balance.usdt : balance.token

  const handlePercentage = (percentage: number) => {
    if (isBuy) {
      // Compra: usa % do saldo USDT
      const usdtAmount = (availableBalance * percentage) / 100
      const tokenAmount = usdtAmount / parseFloat(price || '1')
      setAmount(tokenAmount.toFixed(8))
    } else {
      // Venda: usa % do saldo de tokens
      const tokenAmount = (availableBalance * percentage) / 100
      setAmount(tokenAmount.toFixed(8))
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit chamado')
    console.log('📊 Estado atual:', { orderSide, isBuy, amount, price, orderType })
    
    const amountNum = parseFloat(amount)
    const priceNum = parseFloat(price)

    if (!amountNum || amountNum <= 0) {
      console.log('❌ Quantidade inválida:', amountNum)
      Alert.alert('Erro', 'Digite uma quantidade válida')
      return
    }

    if (orderType === 'limit' && (!priceNum || priceNum <= 0)) {
      Alert.alert('Erro', 'Digite um preço válido')
      return
    }

    // ✅ Validação de quantidade mínima do token
    if (marketLimits?.minAmount && amountNum < marketLimits.minAmount) {
      Alert.alert(
        'Quantidade Inválida', 
        `A quantidade mínima para ${symbol} é ${marketLimits.minAmount}`
      )
      return
    }

    // ✅ Validação de custo mínimo (total em USDT)
    if (marketLimits?.minCost && total < marketLimits.minCost) {
      Alert.alert(
        'Valor Inválido', 
        `O valor mínimo da ordem é $ ${marketLimits.minCost.toFixed(2)}`
      )
      return
    }

    if (isBuy && total > availableBalance) {
      console.log('❌ Saldo USDT insuficiente:', { total, availableBalance })
      Alert.alert('Saldo Insuficiente', `Você precisa de $ ${apiService.formatUSD(total)} USDT`)
      return
    }

    if (!isBuy && amountNum > availableBalance) {
      console.log('❌ Saldo TOKEN insuficiente:', { amountNum, availableBalance, symbol })
      Alert.alert('Saldo Insuficiente', `Você possui apenas ${availableBalance.toFixed(8)} ${symbol}`)
      return
    }

    console.log('✅ Validações passaram, abrindo modal de confirmação')
    
    // Salva dados da ordem pendente e abre modal de confirmação
    setPendingOrder({ amount: amountNum, price: priceNum, total })
    setConfirmTradeVisible(true)
  }

  const confirmTrade = async () => {
    if (!pendingOrder) return
    
    setConfirmTradeVisible(false)
    await executeOrder(pendingOrder.amount, pendingOrder.price, pendingOrder.total)
    setPendingOrder(null)
  }

  const executeOrder = async (amountNum: number, priceNum: number, total: number) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não autenticado')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('🔄 [TradeModal] Criando ordem...')
      console.log('📋 [TradeModal] Tipo:', isBuy ? 'COMPRA' : 'VENDA')
      console.log('📋 [TradeModal] Dados:', { userId: user.id, exchangeId, symbol, amountNum, orderType, priceNum })
      
      // Chama a API de compra ou venda
      const result = isBuy 
        ? await apiService.createBuyOrder(
            user.id,
            exchangeId,
            symbol,
            amountNum,
            orderType,
            orderType === 'limit' ? priceNum : undefined
          )
        : await apiService.createSellOrder(
            user.id,
            exchangeId,
            symbol,
            amountNum,
            orderType,
            orderType === 'limit' ? priceNum : undefined
          )
      
      console.log('📥 [TradeModal] Resultado da API:', result)
      
      // Verifica se a ordem foi criada com sucesso
      if (result.success) {
        console.log('✅ [TradeModal] Ordem criada com sucesso!')
        const isDryRun = result.dry_run === true
        const orderId = result.order?.id || 'N/A'
        const orderStatus = result.order?.status || 'unknown'
        
        // Fecha o modal IMEDIATAMENTE para feedback visual rápido
        console.log('📋 [TradeModal] 🚪 Fechando modal...')
        onClose()
        
        // Invalida o cache de ordens para forçar atualização
        console.log('🔄 [TradeModal] Invalidando cache de ordens abertas...')
        const cacheKey = `${user.id}_${exchangeId}`
        ordersCache.delete(cacheKey)
        console.log('✅ [TradeModal] Cache invalidado:', cacheKey)
        
        // Chama callback para atualizar lista de ordens abertas
        if (onOrderCreated) {
          console.log('🔄 [TradeModal] Chamando callback onOrderCreated...')
          await onOrderCreated()
          console.log('✅ [TradeModal] Callback onOrderCreated completado!')
        } else {
          console.warn('⚠️ [TradeModal] onOrderCreated não está definido!')
        }
        
        // Mostra alerta de sucesso
        Alert.alert(
          isDryRun ? '✅ Ordem Simulada' : '✅ Ordem Criada',
          isDryRun 
            ? `Ordem ${orderId} foi simulada com sucesso!\n\nStatus: ${orderStatus}\nTipo: ${orderType}\nLado: ${isBuy ? 'Compra' : 'Venda'}\nQuantidade: ${amountNum.toFixed(8)} ${symbol}\n${orderType === 'limit' ? `Preço: ${apiService.formatUSD(priceNum)}` : 'Preço: Mercado'}\nTotal: ${apiService.formatUSD(total)}\n\n⚠️ Sistema em modo DRY-RUN`
            : `Ordem ${orderId} criada com sucesso!\n\nStatus: ${orderStatus}\nQuantidade: ${amountNum.toFixed(8)} ${symbol}\nTotal: ${apiService.formatUSD(total)}`
        )
      } else {
        console.log('❌ API retornou sucesso=false:', result)
        throw new Error(result.error || 'Erro desconhecido ao criar ordem')
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar ordem:', error)
      console.error('Stack:', error.stack)
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível criar a ordem. Tente novamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Trade {symbol.toUpperCase()}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {exchangeName} • {currentPrice < 0.01 
                  ? currentPrice.toFixed(10).replace(/\.?0+$/, '') 
                  : apiService.formatUSD(currentPrice)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Abas Comprar/Vender - Estilo suave */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  isBuy && styles.tabActive,
                  { 
                    backgroundColor: isBuy ? '#10b98115' : colors.surface,
                    borderColor: isBuy ? '#10b981' : colors.border
                  }
                ]}
                onPress={() => setOrderSide('buy')}
              >
                <Text style={[
                  styles.tabText,
                  { color: isBuy ? '#10b981' : colors.textSecondary }
                ]}>
                  Comprar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  !isBuy && styles.tabActive,
                  { 
                    backgroundColor: !isBuy ? '#ef444415' : colors.surface,
                    borderColor: !isBuy ? '#ef4444' : colors.border
                  }
                ]}
                onPress={() => {
                  console.log('🔴 Clicou em VENDER')
                  setOrderSide('sell')
                }}
              >
                <Text style={[
                  styles.tabText,
                  { color: !isBuy ? '#ef4444' : colors.textSecondary }
                ]}>
                  Vender
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tipo de Ordem */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Tipo de Ordem</Text>
              <View style={styles.orderTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.orderTypeButton,
                    orderType === 'limit' && styles.orderTypeButtonActive,
                    { 
                      backgroundColor: orderType === 'limit' ? colors.primary : colors.surface,
                      borderColor: orderType === 'limit' ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => setOrderType('limit')}
                >
                  <Text style={[
                    styles.orderTypeButtonText,
                    { color: orderType === 'limit' ? colors.primaryText : colors.textSecondary }
                  ]}>
                    Limit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderTypeButton,
                    orderType === 'market' && styles.orderTypeButtonActive,
                    { 
                      backgroundColor: orderType === 'market' ? colors.primary : colors.surface,
                      borderColor: orderType === 'market' ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => {
                    setOrderType('market')
                    setPrice(currentPrice.toString())
                  }}
                >
                  <Text style={[
                    styles.orderTypeButtonText,
                    { color: orderType === 'market' ? colors.primaryText : colors.textSecondary }
                  ]}>
                    Market
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preço */}
            {orderType === 'limit' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Preço</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border
                    }
                  ]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )}

            {/* Quantidade */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Quantidade ({symbol})
                </Text>
                <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                  Disponível: {availableBalance.toFixed(8)}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00000000"
                placeholderTextColor={colors.textSecondary}
              />

              {/* Botões de Porcentagem */}
              <View style={styles.percentageButtons}>
                {[25, 50, 75, 100].map((percent) => (
                  <TouchableOpacity
                    key={percent}
                    style={[styles.percentageButton, { borderColor: colors.border }]}
                    onPress={() => handlePercentage(percent)}
                  >
                    <Text style={[styles.percentageButtonText, { color: colors.primary }]}>
                      {percent}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview do Total */}
            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  Total {isBuy ? 'a Pagar' : 'a Receber'}
                </Text>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  $ {apiService.formatUSD(total)}
                </Text>
              </View>
              
              {orderType === 'limit' && (
                <>
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      Preço
                    </Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>
                      {parseFloat(price || '0') < 0.01 
                        ? parseFloat(price || '0').toFixed(10).replace(/\.?0+$/, '') 
                        : apiService.formatUSD(parseFloat(price || '0'))}
                    </Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                      Quantidade
                    </Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>
                      {(() => {
                        const qty = parseFloat(amount || '0')
                        if (qty === 0) return '0.00'
                        if (qty >= 1000000) return `${(qty / 1000000).toFixed(2)}Mi`
                        if (qty >= 1000) return `${(qty / 1000).toFixed(2)}K`
                        if (qty < 1) return qty.toFixed(8).replace(/\.?0+$/, '')
                        return qty.toFixed(2)
                      })()} {symbol.toUpperCase()}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Botão Confirmar - Estilo suave */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: isBuy ? '#10b98120' : '#ef444420',
                  borderColor: isBuy ? '#10b981' : '#ef4444',
                },
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={[
                styles.submitButtonText,
                { color: isBuy ? '#10b981' : '#ef4444' }
              ]}>
                {isSubmitting ? 'Criando ordem...' : `${isBuy ? 'Comprar' : 'Vender'} ${symbol}`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Modal de Confirmação de Trade */}
      <Modal
        visible={confirmTradeVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmTradeVisible(false)}
      >
        <Pressable 
          style={styles.confirmOverlay} 
          onPress={() => setConfirmTradeVisible(false)}
        >
          <Pressable 
            style={styles.confirmSafeArea} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.confirmContainer, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={[styles.confirmHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  {isBuy ? 'Compra' : 'Venda'}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.confirmContent}>
                <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
                  {isBuy ? 'Deseja realmente comprar' : 'Deseja realmente vender'} {symbol.toUpperCase()}?
                </Text>
                
                {pendingOrder && (
                  <View style={[styles.confirmDetails, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Par:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {symbol.toUpperCase()}/USDT
                      </Text>
                    </View>
                    
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Lado:
                      </Text>
                      <Text style={[styles.confirmValue, { color: isBuy ? '#10b981' : '#ef4444' }]}>
                        {isBuy ? 'Compra' : 'Venda'}
                      </Text>
                    </View>
                    
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Tipo:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {orderType === 'market' ? 'Mercado' : 'Limite'}
                      </Text>
                    </View>
                    
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Quantidade:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {pendingOrder.amount.toFixed(8)} {symbol.toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.confirmDetailRow}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                        Preço:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {orderType === 'market' ? 'Mercado' : `$ ${apiService.formatUSD(pendingOrder.price)}`}
                      </Text>
                    </View>
                    
                    <View style={[styles.confirmDetailRow, styles.confirmTotalRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary, fontWeight: fontWeights.semibold }]}>
                        Total:
                      </Text>
                      <Text style={[styles.confirmValue, { color: colors.text, fontWeight: fontWeights.semibold, fontSize: typography.h4 }]}>
                        $ {apiService.formatUSD(pendingOrder.total)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Footer com botões */}
              <View style={styles.confirmFooter}>
                <TouchableOpacity
                  onPress={() => {
                    setConfirmTradeVisible(false)
                    setPendingOrder(null)
                  }}
                  style={[styles.confirmButton, styles.confirmButtonCancel, { borderColor: colors.border }]}
                >
                  <Text style={[styles.confirmButtonText, { color: colors.textSecondary }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={confirmTrade}
                  style={[styles.confirmButton, styles.confirmButtonConfirm, { backgroundColor: isBuy ? '#10b981' : '#ef4444' }]}
                >
                  <Text style={[styles.confirmButtonText, { color: '#fff' }]}>
                    {isBuy ? 'Compra' : 'Venda'}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: fontWeights.medium,
  },
  subtitle: {
    fontSize: typography.body,
    fontWeight: fontWeights.regular,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: fontWeights.light,
  },
  content: {
    padding: 24,
  },
  tabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12, // 14→12
    borderRadius: 10, // 12→10
    borderWidth: 1.5, // 2→1.5
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // 52→48
  },
  tabActive: {
    // Applied via backgroundColor
  },
  tabText: {
    fontSize: typography.h4,
    fontWeight: fontWeights.medium, // bold→medium
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: typography.body,
    fontWeight: fontWeights.medium,
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceText: {
    fontSize: typography.bodySmall,
    fontWeight: fontWeights.regular,
  },
  orderTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 10, // 12→10
    borderRadius: 8, // 10→8
    borderWidth: 1.5, // 2→1.5
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // 48→44
  },
  orderTypeButtonActive: {
    // Applied via backgroundColor
  },
  orderTypeButtonText: {
    fontSize: typography.body,
    fontWeight: fontWeights.medium, // bold→medium
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12, // 14→12
    borderRadius: 10, // 12→10
    borderWidth: 1.5, // 2→1.5
    fontSize: typography.h4,
    fontWeight: fontWeights.medium,
    minHeight: 48, // 52→48
  },
  percentageButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: 8, // 10→8
    borderRadius: 6, // 8→6
    borderWidth: 1, // 1.5→1
    alignItems: 'center',
    minHeight: 36, // 40→36
    justifyContent: 'center',
  },
  percentageButtonText: {
    fontSize: typography.body,
    fontWeight: fontWeights.medium,
  },
  previewCard: {
    padding: 18, // 20→18
    borderRadius: 12, // 16→12
    borderWidth: 1.5, // 2→1.5
    marginBottom: 24,
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: typography.body,
    fontWeight: fontWeights.regular,
  },
  previewValue: {
    fontSize: typography.h4,
    fontWeight: fontWeights.medium, // bold→medium
  },
  submitButton: {
    paddingVertical: 14, // 18→14
    borderRadius: 12, // 16→12
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 50, // 56→50
    borderWidth: 2,
    // Removidas shadows agressivas
  },
  submitButtonDisabled: {
    opacity: 0.5, // 0.6→0.5
  },
  submitButtonText: {
    fontSize: typography.h4,
    fontWeight: fontWeights.medium, // bold→medium
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
