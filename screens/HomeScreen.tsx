import { StyleSheet, ScrollView, SafeAreaView, Animated, RefreshControl } from "react-native"
import { useRef, useState, useMemo, useCallback, memo, useEffect } from "react"
import { Header } from "../components/Header"
import { PortfolioOverview } from "../components/PortfolioOverview"
import { ExchangesList } from "../components/ExchangesList"
import { NotificationsModal } from "../components/NotificationsModal"
import { useTheme } from "../contexts/ThemeContext"
import { useBalance } from "../contexts/BalanceContext"
import { usePortfolio } from "../contexts/PortfolioContext"
import { mockNotifications } from "../types/notifications"
import { QuickChart } from "../components/QuickChart"
import { ExchangesPieChart } from "../components/ExchangesPieChart"
import { apiService } from "../services/api"
import { config } from "../lib/config"

export const HomeScreen = memo(function HomeScreen({ navigation }: any) {
  const { colors } = useTheme()
  const { refresh: refreshBalance, refreshing } = useBalance()
  const { refreshEvolution } = usePortfolio()
  const scrollY = useRef(new Animated.Value(0)).current
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)
  const [availableExchangesCount, setAvailableExchangesCount] = useState(0)
  const lastScrollY = useRef(0)

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

  // Refresh completo: balances + evolution
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refreshBalance(),
      refreshEvolution()
    ])
  }, [refreshBalance, refreshEvolution])

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
        <QuickChart />
        <ExchangesPieChart />
        <ExchangesList 
          onAddExchange={onAddExchange}
          availableExchangesCount={availableExchangesCount}
        />
      </Animated.ScrollView>

      <NotificationsModal 
        visible={notificationsModalVisible}
        onClose={onModalClose}
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
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
})
