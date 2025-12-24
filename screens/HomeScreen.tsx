import { StyleSheet, ScrollView, SafeAreaView, Animated, RefreshControl } from "react-native"
import { useRef, useState, useMemo, useCallback, memo, useEffect } from "react"
import { Header } from "../components/Header"
import { PortfolioOverview } from "../components/PortfolioOverview"
import { ExchangesList } from "../components/ExchangesList"
import { NotificationsModal } from "../components/NotificationsModal"
import { OpenOrdersModal } from "../components/open-orders-modal"
import { OrderDetailsModal } from "../components/order-details-modal"
import { useTheme } from "../contexts/ThemeContext"
import { useBalance } from "../contexts/BalanceContext"
import { mockNotifications } from "../types/notifications"
import { apiService } from "../services/api"
import { config } from "../lib/config"

export const HomeScreen = memo(function HomeScreen({ navigation }: any) {
  const { colors } = useTheme()
  const { refresh: refreshBalance, refreshing } = useBalance()
  const scrollY = useRef(new Animated.Value(0)).current
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)
  const [availableExchangesCount, setAvailableExchangesCount] = useState(0)
  const [openOrdersModalVisible, setOpenOrdersModalVisible] = useState(false)
  const [orderDetailsModalVisible, setOrderDetailsModalVisible] = useState(false)
  const [selectedExchangeId, setSelectedExchangeId] = useState<string>("")
  const [selectedExchangeName, setSelectedExchangeName] = useState<string>("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const lastScrollY = useRef(0)
  const refreshOrdersRef = useRef<(() => void) | null>(null)

  const unreadCount = useMemo(() => 
    mockNotifications.filter(n => !n.read).length, 
    []
  )

  useEffect(() => {
    loadAvailableExchanges()
  }, [])

  const loadAvailableExchanges = async () => {
    try {
      const data = await apiService.getAvailableExchanges(config.userId)
      setAvailableExchangesCount(data.exchanges?.length || 0)
    } catch (error) {
      console.error('Error loading available exchanges:', error)
    }
  }

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

  const handleScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y
        
        // Detectar direção do scroll
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
          setIsScrollingDown(true)
        } else if (currentScrollY < lastScrollY.current) {
          setIsScrollingDown(false)
        }
        
        lastScrollY.current = currentScrollY
      },
    }
  ), [])
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        hideIcons={isScrollingDown} 
        onNotificationsPress={onNotificationsPress}
        onProfilePress={onProfilePress}
        unreadCount={unreadCount}
      />
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
          availableExchangesCount={availableExchangesCount}
          onOpenOrdersPress={onOpenOrdersPress}
          onRefreshOrders={() => {
            // Salva referência para a função de refresh
            refreshOrdersRef.current = (window as any).__exchangesListRefreshOrders
          }}
        />
      </Animated.ScrollView>

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
          // Após cancelar ordem, atualiza lista de tokens
          console.log('🔄 [HomeScreen] Ordem cancelada, atualizando balances...')
          await refreshBalance()
          
          // Atualiza também contagem de ordens abertas
          console.log('🔄 [HomeScreen] Atualizando ordens abertas...')
          if (refreshOrdersRef.current) {
            await refreshOrdersRef.current()
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
