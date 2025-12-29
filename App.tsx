import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, View, LogBox } from "react-native"
import { useEffect, useRef, useState } from "react"
import Svg, { Path, Rect, Circle } from "react-native-svg"

// Desabilitar warnings de desenvolvimento
if (__DEV__) {
  LogBox.ignoreAllLogs(true) // Ignora todos os logs em desenvolvimento
}

import { HomeScreen } from "./screens/HomeScreen"
import { ExchangesScreen } from "./screens/ExchangesScreen"
import { StrategyScreen } from "./screens/StrategyScreen"
import { SettingsScreen } from "./screens/SettingsScreen"
import { ProfileScreen } from "./screens/ProfileScreen"
import { LoginScreen } from "./screens/LoginScreen"
import { SignUpScreen } from "./screens/SignUpScreen"
import { ThemeProvider, useTheme } from "./contexts/ThemeContext"
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext"
import { BalanceProvider, useBalance } from "./contexts/BalanceContext"
import { PortfolioProvider } from "./contexts/PortfolioContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { PrivacyProvider } from "./contexts/PrivacyContext"
import { NotificationsProvider } from "./contexts/NotificationsContext"
import { AlertsProvider } from "./contexts/AlertsContext"
import { LoadingProgress } from "./components/LoadingProgress"
import { MaintenanceScreen } from "./components/MaintenanceScreen"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// DataLoader - monitora quando os dados estão prontos e notifica
function DataLoader({ children, onDataReady }: { children: React.ReactNode, onDataReady: () => void }) {
  const { data: balanceData, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useBalance()
  const hasCalledRef = useRef(false)
  const hasRefreshedRef = useRef(false)
  const [showMaintenance, setShowMaintenance] = useState(false)

  // Força refresh quando monta (após login)
  useEffect(() => {
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true
      
      refreshBalance().catch(err => {
        console.error('❌ Erro ao fazer refresh inicial:', err)
      })
    }
  }, [refreshBalance])

  // Detecta erros críticos de API (erro ao carregar balance = API offline)
  const isCriticalError = balanceError !== null && !balanceLoading

  useEffect(() => {
    // Se erro crítico detectado, mostra tela de manutenção
    if (isCriticalError && !showMaintenance) {
      setShowMaintenance(true)
      hasCalledRef.current = true
      onDataReady()
      return
    }

    // ✅ NOVO: Considera dados prontos quando:
    // 1. Loading terminou (!balanceLoading)
    // 2. E: (tem dados OU tem erro OU usuário novo sem exchanges)
    const balanceReady = !balanceLoading && (
      balanceData !== null ||  // Tem dados
      balanceError !== null ||  // Tem erro (vai mostrar mensagem)
      (balanceData as any)?.exchanges?.length === 0  // Usuário novo sem exchanges (válido!)
    )

    console.log('🔍 [DataLoader] Status:', {
      balanceLoading,
      hasData: balanceData !== null,
      hasError: balanceError !== null,
      exchangesCount: balanceData?.exchanges?.length || 0,
      balanceReady,
      hasCalledOnDataReady: hasCalledRef.current
    })

    // Chama onDataReady quando balance terminou de carregar
    if (balanceReady && !hasCalledRef.current) {
      console.log('✅ [DataLoader] Dados prontos! Liberando interface...')
      hasCalledRef.current = true
      onDataReady()
    }
  }, [balanceLoading, balanceData, balanceError, onDataReady, isCriticalError, showMaintenance])

  // Timeout de segurança: se demorar mais de 10 segundos, finaliza o loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasCalledRef.current) {
        hasCalledRef.current = true
        onDataReady()
      }
    }, 10000) // 10 segundos

    return () => clearTimeout(timeout)
  }, [onDataReady])

  // Reset quando desmonta (logout)
  useEffect(() => {
    return () => {
      hasCalledRef.current = false
      hasRefreshedRef.current = false
      setShowMaintenance(false)
    }
  }, [])

  // Função de retry
  const handleRetry = async () => {
    setShowMaintenance(false)
    hasCalledRef.current = false
    
    // Tenta recarregar os dados
    try {
      await refreshBalance()
    } catch (error) {
      console.error('❌ Erro ao tentar reconectar:', error)
    }
  }

  // Se erro crítico, mostra tela de manutenção
  if (showMaintenance) {
    return <MaintenanceScreen onRetry={handleRetry} />
  }

  return <>{children}</>
}

// Auth Stack (Login/SignUp)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  )
}

// Main App Tabs (após login)
function MainTabs() {
  const { t } = useLanguage()
  const { colors } = useTheme()
  
  return (
    <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
            height: 56,
            paddingBottom: 6,
            paddingTop: 6,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "400",
            marginTop: -2,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: t('nav.home'),
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          }}
        />
        <Tab.Screen
          name="Exchanges"
          component={ExchangesScreen}
          options={{
            tabBarLabel: t('nav.exchanges'),
            tabBarIcon: ({ color }) => <ExchangeIcon color={color} />,
          }}
        />
        <Tab.Screen
          name="Strategy"
          component={StrategyScreen}
          options={{
            tabBarLabel: t('nav.strategies'),
            tabBarIcon: ({ color }) => <RobotIcon color={color} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Config',
            tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarButton: () => null,
          }}
        />
      </Tab.Navigator>
  )
}

// App Navigator - decide entre Auth ou Main baseado no login
function AppNavigator() {
  const { isAuthenticated, isLoading, isLoadingData, setLoadingDataComplete, user } = useAuth()
  const { colors, isDark } = useTheme()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      {isAuthenticated && !isLoadingData ? (
        // Só mostra MainTabs quando COMPLETAMENTE pronto (autenticado + dados carregados)
        <MainTabs />
      ) : (
        // Mantém AuthStack durante login E carregamento para não desmontar LoginScreen
        <>
          <AuthStack />
          
          {/* DataLoader monitora em segundo plano DURANTE o carregamento após login */}
          {isAuthenticated && isLoadingData && (
            <DataLoader onDataReady={setLoadingDataComplete}>
              <View />
            </DataLoader>
          )}
        </>
      )}
      
      {/* LoadingProgress aparece sobre qualquer tela quando isLoadingData = true */}
      <LoadingProgress visible={isLoadingData} />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <PrivacyProvider>
            <NotificationsProvider>
              <AlertsProvider>
                <BalanceProvider>
                  <PortfolioProvider>
                    <AppNavigator />
                  </PortfolioProvider>
                </BalanceProvider>
              </AlertsProvider>
            </NotificationsProvider>
          </PrivacyProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}

// Simple icon components
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="1.8" />
  </Svg>
)

const ExchangeIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke={color} strokeWidth="1.8" />
  </Svg>
)

const RobotIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8" />
    <Circle cx="9" cy="16" r="1" fill={color} />
    <Circle cx="15" cy="16" r="1" fill={color} />
    <Path d="M9 19h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M12 3v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Circle cx="12" cy="3" r="1" fill={color} />
    <Path d="M5 14h2M17 14h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
)

const SettingsIcon = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="12" r="2" stroke={color} strokeWidth="1.8" />
    <Circle cx="18" cy="6" r="2" stroke={color} strokeWidth="1.8" />
    <Circle cx="18" cy="18" r="2" stroke={color} strokeWidth="1.8" />
    <Path
      d="M8 12h13M3 12h2M8 6h8M3 18h12"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
)
