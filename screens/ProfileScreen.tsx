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
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10b981",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  editAvatarText: {
    fontSize: 13,
  },
  userName: {
    fontSize: 22,
    fontWeight: "400",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 18,
  },
  editProfileButton: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "400",
    color: "#10b981",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  // Menu
  menuSection: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "400",
    marginBottom: 14,
    paddingHorizontal: 2,
    letterSpacing: 0.2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  menuItemArrow: {
    fontSize: 22,
    fontWeight: "300",
    opacity: 0.5,
  },
  // Logout
  logoutButton: {
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  version: {
    textAlign: "center",
    fontSize: 13,
    marginBottom: 32,
    opacity: 0.5,
  },
  // Animated Header
  animatedHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "400",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  // Theme Toggle
  themeSubtext: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
  },
  toggle: {
    width: 54,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d4d4d4",
    padding: 3,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#10b981",
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
})
