import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { ActivityIndicator, View } from "react-native"
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
import { BalanceProvider } from "./contexts/BalanceContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { PrivacyProvider } from "./contexts/PrivacyContext"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

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
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: t('nav.profile'),
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
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
      </Tab.Navigator>
  )
}

// App Navigator - decide entre Auth ou Main baseado no login
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth()
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
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
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
              <AppNavigator />
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

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <Path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="2" />
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
