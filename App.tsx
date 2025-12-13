import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { StatusBar } from "expo-status-bar"
import { HomeScreen } from "./screens/HomeScreen"
import { ExchangesScreen } from "./screens/ExchangesScreen"
import { WalletScreen } from "./screens/WalletScreen"
import { ProfileScreen } from "./screens/ProfileScreen"
import { ThemeProvider } from "./contexts/ThemeContext"

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#0a0a0a",
              borderTopColor: "#1a1a1a",
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
            },
            tabBarActiveTintColor: "#10b981",
            tabBarInactiveTintColor: "#6b7280",
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: "Início",
              tabBarIcon: ({ color }) => <HomeIcon color={color} />,
            }}
          />
          <Tab.Screen
            name="Exchanges"
            component={ExchangesScreen}
            options={{
              tabBarLabel: "Exchanges",
              tabBarIcon: ({ color }) => <ExchangeIcon color={color} />,
            }}
          />
          <Tab.Screen
            name="Wallet"
            component={WalletScreen}
            options={{
              tabBarLabel: "Carteira",
              tabBarIcon: ({ color }) => <WalletIcon color={color} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarLabel: "Perfil",
              tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  )
}

// Simple icon components
const HomeIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" />
  </svg>
)

const ExchangeIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke={color} strokeWidth="2" />
  </svg>
)

const WalletIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={color} strokeWidth="2" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={color} strokeWidth="2" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" stroke={color} strokeWidth="2" />
  </svg>
)

const ProfileIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="2" />
  </svg>
)
