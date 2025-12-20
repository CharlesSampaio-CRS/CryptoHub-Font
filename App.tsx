import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, View } from "react-native"
import { useEffect, useRef, useState } from "react"
import Svg, { Path, Rect, Circle } from "react-native-svg"
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
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { PrivacyProvider } from "./contexts/PrivacyContext"
import { PortfolioProvider, usePortfolio } from "./contexts/PortfolioContext"
import { LoadingProgress } from "./components/LoadingProgress"
import { MaintenanceScreen } from "./components/MaintenanceScreen"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// DataLoader - monitora quando os dados estão prontos e notifica
function DataLoader({ children, onDataReady }: { children: React.ReactNode, onDataReady: () => void }) {
  const { data: balanceData, loading: balanceLoading, error: balanceError, refresh: refreshBalance } = useBalance()
  const { evolutionData: portfolioData, loading: portfolioLoading, error: portfolioError, refreshEvolution } = usePortfolio()
  const hasCalledRef = useRef(false)
  const hasRefreshedRef = useRef(false)
  const [showMaintenance, setShowMaintenance] = useState(false)

  // Força refresh quando monta (após login)
  useEffect(() => {
    if (!hasRefreshedRef.current) {
      console.log('🔄 DataLoader: Forçando refresh após login...')
      hasRefreshedRef.current = true
      
      const startTime = Date.now()
      Promise.all([
        refreshBalance(),
        refreshEvolution()
      ]).then(() => {
        const duration = Date.now() - startTime
        console.log(`✅ DataLoader: Dados carregados em ${duration}ms`)
      }).catch(err => {
        console.error('❌ Erro ao fazer refresh inicial:', err)
      })
    }
  }, [refreshBalance, refreshEvolution])

  // Detecta erros críticos de API (ambos com erro ao mesmo tempo = API offline)
  const isCriticalError = balanceError !== null && portfolioError !== null && 
                          !balanceLoading && !portfolioLoading

  useEffect(() => {
    // Se erro crítico detectado, mostra tela de manutenção
    if (isCriticalError && !showMaintenance) {
      console.log('🚨 DataLoader: Erro crítico detectado (API offline), mostrando tela de manutenção')
      setShowMaintenance(true)
      hasCalledRef.current = true
      onDataReady() // Finaliza o loading progress
      return
    }

    // Aguarda os dados estarem prontos (não loading E dados existem)
    const balanceReady = !balanceLoading && (balanceData !== null || balanceError !== null)
    const portfolioReady = !portfolioLoading && (portfolioData !== null || portfolioError !== null)
    
    console.log('📊 DataLoader check:', {
      balanceReady,
      portfolioReady,
      balanceLoading,
      portfolioLoading,
      hasBalance: !!balanceData,
      hasPortfolio: !!portfolioData,
      balanceError,
      portfolioError,
      hasCalled: hasCalledRef.current
    })

    // Chama onDataReady quando:
    // 1. AMBOS terminaram de carregar (sucesso OU erro)
    // 2. Ainda não foi chamado
    if (balanceReady && portfolioReady && !hasCalledRef.current) {
      if (balanceError || portfolioError) {
        console.log('⚠️ DataLoader: Erro ao carregar dados, mas finalizando loading...')
        if (balanceError) console.error('❌ Balance error:', balanceError)
        if (portfolioError) console.error('❌ Portfolio error:', portfolioError)
      } else {
        console.log('✅ DataLoader: Todos os dados prontos! Desativando loading...')
      }
      
      hasCalledRef.current = true
      onDataReady()
    }
  }, [balanceLoading, portfolioLoading, balanceData, portfolioData, balanceError, portfolioError, onDataReady, isCriticalError, showMaintenance])

  // Timeout de segurança: se demorar mais de 10 segundos, finaliza o loading
  useEffect(() => {
    console.log('⏱️ DataLoader: Timeout de segurança iniciado (10 segundos)')
    const timeout = setTimeout(() => {
      if (!hasCalledRef.current) {
        console.log('⏱️ DataLoader: Timeout de 10s atingido, finalizando loading de segurança...')
        console.log('⚠️ Dados podem não ter carregado completamente')
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
    console.log('🔄 DataLoader: Tentando reconectar...')
    setShowMaintenance(false)
    hasCalledRef.current = false
    
    // Tenta recarregar os dados
    try {
      await Promise.all([
        refreshBalance(),
        refreshEvolution()
      ])
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
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "400",
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

  // Debug: monitorar mudanças no estado de autenticação
  useEffect(() => {
    console.log('� AppNavigator - Estado mudou:', {
      isAuthenticated,
      isLoading,
      isLoadingData,
      userEmail: user?.email,
      hasUser: !!user
    })
  }, [isAuthenticated, isLoading, isLoadingData, user])

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
      {!isAuthenticated ? (
        <AuthStack />
      ) : (
        <>
          <DataLoader onDataReady={setLoadingDataComplete}>
            <MainTabs />
          </DataLoader>
          <LoadingProgress visible={isLoadingData} />
        </>
      )}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <PrivacyProvider>
            <BalanceProvider>
              <PortfolioProvider>
                <AppNavigator />
              </PortfolioProvider>
            </BalanceProvider>
          </PrivacyProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}

// Simple icon components
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" />
  </Svg>
)

const ExchangeIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke={color} strokeWidth="2" />
  </Svg>
)

const RobotIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
    <Circle cx="9" cy="16" r="1" fill={color} />
    <Circle cx="15" cy="16" r="1" fill={color} />
    <Path d="M9 19h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 3v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="3" r="1" fill={color} />
    <Path d="M5 14h2M17 14h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
)

const SettingsIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="12" r="2" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="6" r="2" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="18" r="2" stroke={color} strokeWidth="2" />
    <Path
      d="M8 12h13M3 12h2M8 6h8M3 18h12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
)
