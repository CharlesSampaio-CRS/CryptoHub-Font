import { StyleSheet, ScrollView, SafeAreaView, Animated } from "react-native"
import { useRef, useState, useMemo, useCallback, memo } from "react"
import { Header } from "../components/Header"
import { PortfolioOverview } from "../components/PortfolioOverview"
import { ExchangesList } from "../components/ExchangesList"
import { NotificationsModal } from "../components/NotificationsModal"
import { useTheme } from "../contexts/ThemeContext"
import { mockNotifications } from "../types/notifications"
import { QuickChart } from "../components/QuickChart"

export const HomeScreen = memo(function HomeScreen({ navigation }: any) {
  const { colors } = useTheme()
  const scrollY = useRef(new Animated.Value(0)).current
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)
  const lastScrollY = useRef(0)

  const unreadCount = useMemo(() => 
    mockNotifications.filter(n => !n.read).length, 
    []
  )

  const onNotificationsPress = useCallback(() => {
    setNotificationsModalVisible(true)
  }, [])

  const onSettingsPress = useCallback(() => {
    navigation.navigate('Profile')
  }, [navigation])

  const onModalClose = useCallback(() => {
    setNotificationsModalVisible(false)
  }, [])

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
        onSettingsPress={onSettingsPress}
        unreadCount={unreadCount}
      />
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        <PortfolioOverview />
        <QuickChart />
        <ExchangesList />
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
    padding: 20,
    paddingBottom: 50,
  },
})
