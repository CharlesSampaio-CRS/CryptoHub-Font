import { StyleSheet, ScrollView, SafeAreaView, RefreshControl } from "react-native"
import { useRef, useState, useMemo, useCallback, memo } from "react"
import { Header } from "../components/Header"
import { PortfolioOverview } from "../components/PortfolioOverview"
import { ExchangesList } from "../components/ExchangesList"
import { NotificationsModal } from "../components/NotificationsModal"
import { OpenOrdersModal } from "../components/open-orders-modal"
import { OrderDetailsModal } from "../components/order-details-modal"
import { useTheme } from "../contexts/ThemeContext"
import { useBalance } from "../contexts/BalanceContext"
import { useNotifications } from "../contexts/NotificationsContext"
import { apiService } from "../services/api"
import { config } from "../lib/config"

export const HomeScreen = memo(function HomeScreen({ navigation }: any) {
  const { colors } = useTheme()
  const { refresh: refreshBalance, refreshing } = useBalance()
  const { unreadCount } = useNotifications()
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)
  const [openOrdersModalVisible, setOpenOrdersModalVisible] = useState(false)
  const [orderDetailsModalVisible, setOrderDetailsModalVisible] = useState(false)
  const [selectedExchangeId, setSelectedExchangeId] = useState<string>("")
  const [selectedExchangeName, setSelectedExchangeName] = useState<string>("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const refreshOrdersRef = useRef<(() => void) | null>(null)

  const onNotificationsPress = useCallback(() => {
    setNotificationsModalVisible(true)
  }, [])

  const onProfilePress = useCallback(() => {
    navigation?.navigate('Profile')
  }, [navigation])

  const onAddExchange = useCallback(() => {
    navigation?.navigate('Exchanges', { openTab: 'available' })
  }, [navigation])

  const onModalClose = useCallback(() => {
    setNotificationsModalVisible(false)
  }, [])

  const onOpenOrdersPress = useCallback((exchangeId: string, exchangeName: string) => {
    setSelectedExchangeId(exchangeId)
    setSelectedExchangeName(exchangeName)
    setOpenOrdersModalVisible(true)
  }, [])

  const onSelectOrder = useCallback((order: any) => {
    setSelectedOrder(order)
    setOrderDetailsModalVisible(true)
  }, [])

  // Refresh completo: apenas balances
  const handleRefresh = useCallback(async () => {
    await refreshBalance()
  }, [refreshBalance])
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        onNotificationsPress={onNotificationsPress}
        onProfilePress={onProfilePress}
        unreadCount={unreadCount}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <PortfolioOverview />
        <ExchangesList 
          onAddExchange={onAddExchange}
          onOpenOrdersPress={onOpenOrdersPress}
          onRefreshOrders={() => {
            // Salva referência para a função de refresh
            refreshOrdersRef.current = (window as any).__exchangesListRefreshOrders
          }}
        />
      </ScrollView>

      <NotificationsModal 
        visible={notificationsModalVisible}
        onClose={onModalClose}
      />

      <OpenOrdersModal
        visible={openOrdersModalVisible}
        onClose={() => setOpenOrdersModalVisible(false)}
        exchangeId={selectedExchangeId}
        exchangeName={selectedExchangeName}
        userId={config.userId}
        onSelectOrder={onSelectOrder}
        onOrderCancelled={async () => {
          // Após cancelar ordem, atualiza APENAS a exchange específica
          console.log('🔄 [HomeScreen] Ordem cancelada, atualizando ordens abertas da exchange...')
          const refreshSingleExchange = (window as any).__exchangesListRefreshOrdersForExchange
          if (refreshSingleExchange && selectedExchangeId) {
            await refreshSingleExchange(selectedExchangeId)
          }
        }}
      />

      <OrderDetailsModal
        visible={orderDetailsModalVisible}
        onClose={() => {
          setOrderDetailsModalVisible(false)
          // Reabre o modal de lista quando fechar os detalhes
          setOpenOrdersModalVisible(true)
        }}
        order={selectedOrder}
      />
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 80,
    gap: 12,
  },
})
