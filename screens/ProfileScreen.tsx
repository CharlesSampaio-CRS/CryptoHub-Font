import { Text, StyleSheet, ScrollView, View, TouchableOpacity, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useAuth } from "../contexts/AuthContext"
import Svg, { Path, Circle } from "react-native-svg"

export function ProfileScreen() {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const { user } = useAuth()

  // Usuário mockado para demonstração
  const userData = {
    name: user?.name || "Charles Roberto",
    email: user?.email || "charles.roberto@example.com",
    phone: "+55 (11) 98765-4321",
    memberSince: "Janeiro 2024",
    avatar: null
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Perfil</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Suas informações pessoais</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar e Nome */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
            {userData.avatar ? (
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{userData.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userData.email}</Text>
            <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
              Membro desde {userData.memberSince}
            </Text>
          </View>

          <TouchableOpacity style={[styles.editButton, { borderColor: colors.border }]}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Informações Pessoais */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INFORMAÇÕES PESSOAIS</Text>
          
          {/* Email */}
          <View style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M22 6l-10 7L2 6" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{userData.email}</Text>
              </View>
            </View>
          </View>

          {/* Telefone */}
          <View style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.infoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Telefone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{userData.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seção: Estatísticas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ESTATÍSTICAS</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>5</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Exchanges</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>18</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Criptomoedas</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>247</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dias ativos</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>143</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Transações</Text>
            </View>
          </View>
        </View>

        {/* Seção: Ações */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AÇÕES</Text>
          
          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Alterar Senha</Text>
            </View>
            <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 12h18M12 3v18"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Exportar Dados</Text>
            </View>
            <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Sair da Conta</Text>
            </View>
            <Text style={[styles.actionArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "300",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  profileHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 60,
    padding: 4,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 12,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 12,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  actionArrow: {
    fontSize: 24,
    fontWeight: "300",
  },
})
