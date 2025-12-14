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
              source={{ uri: 'https://ui-avatars.com/api/?name=Charles+Roberto&background=3b82f6&color=fff&size=120' }}
              style={styles.avatar}
            />
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>Charles Roberto</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>charles.roberto@example.com</Text>
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
          
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>{theme === 'dark' ? '🌙' : '☀️'}</Text>
              <View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Modo Escuro</Text>
                <Text style={[styles.themeSubtext, { color: colors.textSecondary }]}>
                  {theme === 'dark' ? 'Ativado' : 'Desativado'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.toggle, theme === 'dark' && styles.toggleActive]}
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <View style={[
                styles.toggleThumb, 
                theme === 'dark' && styles.toggleThumbActive,
                { backgroundColor: theme === 'dark' ? '#fff' : '#9ca3af' }
              ]} />
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
    backgroundColor: "#f0f7ff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  // Profile Card
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 0,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 0,
  },
  userName: {
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: "300",
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 0,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "300",
    color: "#3b82f6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "300",
    color: "#9ca3af",
    textAlign: "center",
  },
  // Menu
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "300",
    marginBottom: 12,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    opacity: 0.6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0,
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
    fontSize: 14,
    fontWeight: "300",
  },
  menuItemArrow: {
    fontSize: 20,
    fontWeight: "300",
    opacity: 0.4,
  },
  // Logout
  logoutButton: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "300",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "300",
    marginBottom: 32,
    opacity: 0.4,
  },
  // Animated Header
  animatedHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "300",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "300",
  },
  // Theme Toggle
  themeSubtext: {
    fontSize: 12,
    fontWeight: "300",
    marginTop: 3,
    opacity: 0.6,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d4d4d4",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#3b82f6",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
})
