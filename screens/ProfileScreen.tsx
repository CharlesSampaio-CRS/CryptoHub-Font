import { Text, StyleSheet, ScrollView, SafeAreaView, View, Image, TouchableOpacity, Alert, Animated } from "react-native"
import { useState, useEffect, useRef } from "react"
import { apiService } from "../services/api"
import { config } from "../lib/config"
import { useTheme } from "../contexts/ThemeContext"

interface ProfileStats {
  totalExchanges: number
  activeExchanges: number
  totalTokens: number
  totalValueUSD: number
}

export function ProfileScreen() {
  const { theme, setTheme, colors } = useTheme()
  const scrollY = useRef(new Animated.Value(0)).current
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -80],
    extrapolate: 'clamp',
  })
  
  const [stats, setStats] = useState<ProfileStats>({
    totalExchanges: 0,
    activeExchanges: 0,
    totalTokens: 0,
    totalValueUSD: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfileStats()
  }, [])

  const fetchProfileStats = async () => {
    try {
      setLoading(true)
      
      // Buscar exchanges vinculadas
      const exchangesResponse = await fetch(
        `${config.apiBaseUrl}/exchanges/linked?user_id=${config.userId}`
      )
      const exchangesData = await exchangesResponse.json()
      const exchanges = exchangesData.data || []
      
      // Buscar saldos
      const balancesResponse = await fetch(
        `${config.apiBaseUrl}/balances?user_id=${config.userId}`
      )
      const balancesData = await balancesResponse.json()
      const balances = balancesData.data || []

      // Calcular estatísticas
      const totalExchanges = exchanges.length
      const activeExchanges = exchanges.filter((ex: any) => ex.status === 'active').length
      
      let totalTokens = 0
      let totalValueUSD = 0
      
      balances.forEach((exchange: any) => {
        const tokens = Object.values(exchange.tokens || {})
        totalTokens += tokens.length
        totalValueUSD += parseFloat(exchange.total_usd || '0')
      })

      setStats({
        totalExchanges,
        activeExchanges,
        totalTokens,
        totalValueUSD,
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => {
          // Implementar logout
          console.log('Logout')
        }},
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader,
          { 
            opacity: headerOpacity, 
            transform: [{ translateY: headerTranslateY }],
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          }
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Configurações da conta</Text>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Perfil do Usuário */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=Charles+Roberto&background=10b981&color=fff&size=120' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={[styles.editAvatarButton, { borderColor: colors.card }]}>
              <Text style={styles.editAvatarText}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>Charles Roberto</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>charles.roberto@example.com</Text>
          
          <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.editProfileText, { color: colors.text }]}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={styles.statValue}>{stats.totalExchanges}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Exchanges</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={styles.statValue}>{stats.activeExchanges}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ativas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={styles.statValue}>{stats.totalTokens}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tokens</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={styles.statValue}>{apiService.formatUSD(stats.totalValueUSD)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Valor Total</Text>
          </View>
        </View>

        {/* Menu de Configurações */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Configurações</Text>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Notificações</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Segurança</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🌍</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Idioma</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>💰</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Moeda Preferida</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Tema */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência</Text>
          
          <View style={styles.themeSelector}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: colors.card, borderColor: theme === 'light' ? colors.primary : colors.cardBorder }
              ]}
              onPress={() => setTheme('light')}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <Text style={[styles.themeText, { color: theme === 'light' ? colors.primary : colors.textSecondary }]}>Light</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: colors.card, borderColor: theme === 'dark' ? colors.primary : colors.cardBorder }
              ]}
              onPress={() => setTheme('dark')}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <Text style={[styles.themeText, { color: theme === 'dark' ? colors.primary : colors.textSecondary }]}>Dark</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: colors.card, borderColor: theme === 'system' ? colors.primary : colors.cardBorder }
              ]}
              onPress={() => setTheme('system')}
            >
              <Text style={styles.themeIcon}>💻</Text>
              <Text style={[styles.themeText, { color: theme === 'system' ? colors.primary : colors.textSecondary }]}>System</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Sobre */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre</Text>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>ℹ️</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Sobre o App</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Termos de Uso</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🔐</Text>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Privacidade</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textSecondary }]}>Versão 1.0.0</Text>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  // Profile Card
  profileCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#10b981",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10b981",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#111827",
  },
  editAvatarText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  editProfileText: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "600",
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  // Menu
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#f9fafb",
    fontWeight: "500",
  },
  menuItemArrow: {
    fontSize: 24,
    color: "#6b7280",
    fontWeight: "300",
  },
  // Logout
  logoutButton: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 32,
  },
  // Animated Header
  animatedHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  // Theme Selector
  themeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  themeOption: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1f2937",
  },
  themeOptionActive: {
    borderColor: "#10b981",
    backgroundColor: "#1f2937",
  },
  themeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  themeText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  themeTextActive: {
    color: "#10b981",
  },
})
