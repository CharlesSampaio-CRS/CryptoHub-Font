import { Text, StyleSheet, ScrollView, View, Image, TouchableOpacity, Alert, Animated, Modal, Pressable, Switch } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRef, useState, useEffect } from "react"
import { config } from "../lib/config"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useAuth } from "../contexts/AuthContext"
import { NotificationsModal } from "../components/NotificationsModal"

export function ProfileScreen() {
  const { theme, setTheme, colors } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const { 
    logout, 
    user,
    biometricAvailable, 
    biometricType, 
    isBiometricEnabled,
    enableBiometric,
    disableBiometric 
  } = useAuth()
  const scrollY = useRef(new Animated.Value(0)).current
  
  // Estados dos modais
  const [aboutModalVisible, setAboutModalVisible] = useState(false)
  const [termsModalVisible, setTermsModalVisible] = useState(false)
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false)
  const [securityModalVisible, setSecurityModalVisible] = useState(false)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  
  // Estados de segurança  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)
  const [autoLockTime, setAutoLockTime] = useState('5') // minutos
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true)
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

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: async () => {
          try {
            await logout()
            Alert.alert('✓ Logout', 'Você saiu com sucesso!')
          } catch (error) {
            Alert.alert('Erro', 'Falha ao fazer logout')
          }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.title')}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t('profile.subtitle')}</Text>
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
              source={{ uri: `https://ui-avatars.com/api/?name=${config.userId}&background=3b82f6&color=fff&size=120` }}
              style={styles.avatar}
            />
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || `@${config.userId}`}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || t('profile.user')}
          </Text>
          {user?.authProvider && (
            <Text style={[styles.authProvider, { color: colors.textSecondary }]}>
              {user.authProvider === 'google' && '🔵 Conectado via Google'}
              {user.authProvider === 'apple' && '🍎 Conectado via Apple'}
              {user.authProvider === 'email' && '📧 Conta local'}
            </Text>
          )}
        </View>

        {/* Menu de Configurações */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.settings')}</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setNotificationsModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>🔔</Text>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.notifications')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setSecurityModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>🔒</Text>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.security')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>💰</Text>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Moeda Preferida</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Aparência */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.appearance')}</Text>
          
          {/* Modo Escuro */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginBottom: 12 }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>{theme === 'dark' ? '🌙' : '☀️'}</Text>
              </View>
              <View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.darkMode')}</Text>
                <Text style={[styles.themeSubtext, { color: colors.textSecondary }]}>
                  {theme === 'dark' ? t('profile.enabled') : t('profile.disabled')}
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

          {/* Idioma */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>🌍</Text>
              </View>
              <View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.language')}</Text>
                <Text style={[styles.themeSubtext, { color: colors.textSecondary }]}>
                  {language === 'pt-BR' ? t('profile.languagePt') : t('profile.languageEn')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.languageToggle}
              onPress={() => setLanguage(language === 'pt-BR' ? 'en-US' : 'pt-BR')}
            >
              <View style={[
                styles.languageOption,
                language === 'pt-BR' && styles.languageOptionActive
              ]}>
                <Text style={styles.flagIcon}>🇧🇷</Text>
              </View>
              <View style={[
                styles.languageOption,
                language === 'en-US' && styles.languageOptionActive
              ]}>
                <Text style={styles.flagIcon}>🇺🇸</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Sobre */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.about')}</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setAboutModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>ℹ️</Text>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.aboutApp')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setTermsModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>📄</Text>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.terms')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setPrivacyModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={styles.menuIcon}>🔐</Text>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.privacy')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textSecondary }]}>{t('profile.version')} 1.0.0</Text>
      </Animated.ScrollView>

      {/* Modal Sobre o App */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayDismiss}
            onPress={() => setAboutModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: 24 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>🚀 CryptoHub</Text>
                <Text style={[styles.modalVersion, { color: colors.textSecondary }]}>Versão 1.0.0</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>O que é o CryptoHub?</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  CryptoHub é uma plataforma completa de agregação e automação de investimentos em criptomoedas. 
                  Conecte múltiplas exchanges, visualize seu portfólio consolidado e automatize suas estratégias de trading.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>🎯 Principais Recursos</Text>
                <View style={styles.featureList}>
                  <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: '500' }}>Agregação Multi-Exchange</Text>: Visualize todos seus ativos em um só lugar
                  </Text>
                  <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: '500' }}>Estratégias Automatizadas</Text>: Crie e gerencie bots de trading personalizados
                  </Text>
                  <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: '500' }}>Portfolio em Tempo Real</Text>: Acompanhe o valor total de seus investimentos
                  </Text>
                  <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: '500' }}>Execuções Detalhadas</Text>: Histórico completo de todas as operações
                  </Text>
                  <Text style={[styles.featureItem, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: '500' }}>Múltiplas Exchanges</Text>: Suporte para Binance, NovaDAX, MEXC e muito mais
                  </Text>
                </View>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>🔒 Segurança</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Suas chaves de API são armazenadas de forma segura e criptografada. Nunca compartilhamos seus dados 
                  com terceiros e você tem controle total sobre suas conexões.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>📧 Suporte</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Entre em contato conosco: support@cryptohub.com
                </Text>

                <Text style={[styles.modalFooter, { color: colors.textSecondary }]}>
                  Desenvolvido com ❤️ para traders de cripto
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setAboutModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Termos de Uso */}
      <Modal
        visible={termsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayDismiss}
            onPress={() => setTermsModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: 24 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>📄 Termos de Uso</Text>
                <Text style={[styles.modalVersion, { color: colors.textSecondary }]}>Última atualização: 14/12/2025</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>1. Aceitação dos Termos</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Ao usar o CryptoHub, você concorda com estes Termos de Uso. Se você não concordar, 
                  não utilize o aplicativo.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>2. Uso do Serviço</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  O CryptoHub é uma plataforma de agregação e automação de trading. Você é responsável por:
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary, marginLeft: 16 }]}>
                  • Manter a segurança de suas credenciais{'\n'}
                  • Todas as decisões de investimento{'\n'}
                  • Configuração adequada de suas estratégias{'\n'}
                  • Monitorar suas operações automatizadas
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>3. Riscos e Responsabilidades</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Trading de criptomoedas envolve riscos significativos. O CryptoHub não se responsabiliza por:
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary, marginLeft: 16 }]}>
                  • Perdas financeiras resultantes de suas operações{'\n'}
                  • Falhas nas exchanges conectadas{'\n'}
                  • Mudanças no mercado de criptomoedas{'\n'}
                  • Execução de estratégias mal configuradas
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>4. Chaves de API</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Você nos autoriza a usar suas chaves de API exclusivamente para:
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary, marginLeft: 16 }]}>
                  • Consultar saldos e posições{'\n'}
                  • Executar ordens de compra e venda conforme suas estratégias{'\n'}
                  • Sincronizar dados do seu portfólio
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>5. Privacidade</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Seus dados são criptografados e protegidos. Não compartilhamos suas informações com terceiros 
                  sem seu consentimento explícito.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>6. Modificações</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Reservamos o direito de modificar estes termos a qualquer momento. Você será notificado 
                  sobre mudanças significativas.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>7. Rescisão</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar contas que 
                  violem estes termos.
                </Text>

                <View style={[styles.termsAcceptContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    <View style={[
                      styles.checkbox, 
                      { borderColor: colors.border },
                      termsAccepted && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}>
                      {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                      Li e aceito os Termos de Uso
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButtonSecondary, { borderColor: colors.border }]}
                  onPress={() => {
                    setTermsModalVisible(false)
                    setTermsAccepted(false)
                  }}
                >
                  <Text style={[styles.modalButtonSecondaryText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    { backgroundColor: termsAccepted ? colors.primary : colors.border }
                  ]}
                  onPress={() => {
                    if (termsAccepted) {
                      setTermsModalVisible(false)
                      Alert.alert('✅ Termos Aceitos', 'Obrigado por aceitar os Termos de Uso!')
                    }
                  }}
                  disabled={!termsAccepted}
                >
                  <Text style={styles.modalButtonText}>Aceitar e Continuar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Política de Privacidade */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayDismiss}
            onPress={() => setPrivacyModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: 24 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>🔐 Política de Privacidade</Text>
                <Text style={[styles.modalVersion, { color: colors.textSecondary }]}>Última atualização: 14/12/2025</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>1. Introdução</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  A sua privacidade é importante para nós. Esta Política de Privacidade explica como coletamos, 
                  usamos, armazenamos e protegemos suas informações pessoais ao usar o CryptoHub.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>2. Informações que Coletamos</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '500' }}>2.1 Informações de Conta:{'\n'}</Text>
                  • Nome de usuário e identificador único{'\n'}
                  • Endereço de email (se fornecido){'\n'}
                  • Preferências de configuração{'\n'}
                  • Histórico de uso do aplicativo
                </Text>

                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '500' }}>2.2 Dados de Exchanges:{'\n'}</Text>
                  • Chaves de API das exchanges conectadas{'\n'}
                  • Saldos e posições de criptomoedas{'\n'}
                  • Histórico de transações{'\n'}
                  • Estratégias de trading configuradas
                </Text>

                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '500' }}>2.3 Dados de Uso:{'\n'}</Text>
                  • Logs de acesso e atividades{'\n'}
                  • Informações do dispositivo (tipo, sistema operacional){'\n'}
                  • Endereço IP (para segurança){'\n'}
                  • Dados de desempenho e erros
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>3. Como Usamos Suas Informações</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Utilizamos suas informações para:{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Fornecer o Serviço:</Text> Conectar com exchanges, 
                  sincronizar saldos e executar estratégias{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Melhorar a Experiência:</Text> Personalizar interface 
                  e otimizar funcionalidades{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Segurança:</Text> Detectar atividades suspeitas, 
                  prevenir fraudes e proteger sua conta{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Suporte:</Text> Responder a solicitações e resolver problemas{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Comunicação:</Text> Enviar notificações importantes 
                  sobre mudanças no serviço
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>4. Proteção de Dados</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Implementamos medidas rigorosas de segurança:{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Criptografia:</Text> Todas as chaves de API são 
                  criptografadas usando AES-256{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Transmissão Segura:</Text> Comunicação via HTTPS/TLS{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Acesso Restrito:</Text> Apenas pessoal autorizado 
                  pode acessar dados sensíveis{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Monitoramento:</Text> Sistemas de detecção de 
                  intrusão e logs de auditoria{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Backups:</Text> Backups regulares em infraestrutura 
                  segura e redundante
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>5. Compartilhamento de Dados</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '500' }}>NÃO compartilhamos</Text> suas informações pessoais 
                  com terceiros, exceto:{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Exchanges:</Text> Apenas para executar suas ordens 
                  (usando suas próprias chaves de API){'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Obrigação Legal:</Text> Quando exigido por lei ou 
                  ordem judicial{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Proteção de Direitos:</Text> Para proteger nossos 
                  direitos legais ou prevenir fraudes{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Com seu Consentimento:</Text> Em situações específicas 
                  com sua permissão expressa
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>6. Retenção de Dados</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Mantemos suas informações enquanto sua conta estiver ativa ou conforme necessário para 
                  fornecer nossos serviços. Você pode solicitar a exclusão de sua conta e dados associados 
                  a qualquer momento.{'\n\n'}
                  Após exclusão:{'\n'}
                  • Dados são removidos em até 30 dias{'\n'}
                  • Backups podem reter dados por até 90 dias{'\n'}
                  • Logs de segurança mantidos por requisitos legais
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>7. Seus Direitos</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Você tem direito a:{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Acessar:</Text> Solicitar cópia de seus dados pessoais{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Corrigir:</Text> Atualizar informações incorretas{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Excluir:</Text> Remover sua conta e dados associados{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Exportar:</Text> Obter seus dados em formato legível{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Revogar:</Text> Desconectar exchanges e revogar permissões{'\n\n'}
                  • <Text style={{ fontWeight: '500' }}>Opor-se:</Text> Recusar processamento de dados para 
                  fins específicos
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>8. Cookies e Tecnologias Semelhantes</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Utilizamos cookies e tecnologias similares para:{'\n'}
                  • Manter você conectado{'\n'}
                  • Lembrar preferências{'\n'}
                  • Analisar uso do aplicativo{'\n'}
                  • Melhorar desempenho{'\n\n'}
                  Você pode gerenciar cookies nas configurações do seu navegador.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>9. Privacidade de Menores</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  O CryptoHub não é destinado a menores de 18 anos. Não coletamos intencionalmente 
                  informações de menores. Se descobrirmos que coletamos dados de um menor, 
                  excluiremos imediatamente.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>10. Transferências Internacionais</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Seus dados podem ser armazenados e processados em servidores localizados em diferentes países. 
                  Garantimos que todas as transferências cumpram leis aplicáveis de proteção de dados.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>11. Atualizações desta Política</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Podemos atualizar esta Política periodicamente. Notificaremos você sobre mudanças 
                  significativas por email ou notificação no aplicativo. Continue usando o serviço após 
                  as mudanças constitui aceitação da nova política.
                </Text>

                <Text style={[styles.modalSectionTitle, { color: colors.text }]}>12. Contato</Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  Para questões sobre privacidade ou exercer seus direitos, entre em contato:{'\n\n'}
                  📧 Email: privacy@cryptohub.com{'\n'}
                  📞 Suporte: support@cryptohub.com{'\n'}
                  🌐 Portal de Privacidade: www.cryptohub.com/privacy
                </Text>

                <View style={[styles.privacyHighlight, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.privacyHighlightTitle, { color: colors.text }]}>🛡️ Seu Controle</Text>
                  <Text style={[styles.privacyHighlightText, { color: colors.textSecondary }]}>
                    Você tem controle total sobre suas chaves de API e pode desconectar exchanges a qualquer 
                    momento através do aplicativo. Suas credenciais nunca são compartilhadas e você pode 
                    excluir sua conta permanentemente quando desejar.
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setPrivacyModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Entendi</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Segurança */}
      <Modal
        visible={securityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayDismiss}
            onPress={() => setSecurityModalVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: 24 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>🔒 Segurança</Text>
                <Text style={[styles.modalVersion, { color: colors.textSecondary }]}>Configure a proteção da sua conta</Text>
              </View>

              <View style={styles.modalBody}>
                {/* Autenticação Biométrica */}
                <View style={styles.securitySection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>🔐 Autenticação Biométrica</Text>
                  <Text style={[styles.securityDescription, { color: colors.textSecondary }]}>
                    Use Face ID ou Touch ID para desbloquear o aplicativo
                  </Text>
                  
                  <View style={[styles.securityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.securityItemContent}>
                      <Text style={styles.securityItemIcon}>
                        {biometricType === 'Face ID' ? '👤' : '👆'}
                      </Text>
                      <View style={styles.securityItemText}>
                        <Text style={[styles.securityItemTitle, { color: colors.text }]}>
                          {biometricType || 'Face ID / Touch ID'}
                        </Text>
                        <Text style={[styles.securityItemSubtitle, { color: colors.textSecondary }]}>
                          {!biometricAvailable 
                            ? 'Não disponível' 
                            : isBiometricEnabled ? 'Ativado' : 'Desativado'}
                        </Text>
                      </View>
                    </View>
                    {biometricAvailable && (
                      <Switch
                        value={isBiometricEnabled}
                        onValueChange={async (value) => {
                          if (value) {
                            const success = await enableBiometric()
                            if (success) {
                              Alert.alert('✓ Ativado', 'Autenticação biométrica ativada com sucesso!')
                            } else {
                              Alert.alert('Erro', 'Falha ao ativar autenticação biométrica')
                            }
                          } else {
                            await disableBiometric()
                            Alert.alert('✓ Desativado', 'Autenticação biométrica desativada')
                          }
                        }}
                        trackColor={{ false: colors.border, true: '#3b82f6' }}
                        thumbColor={isBiometricEnabled ? '#ffffff' : '#f4f3f4'}
                      />
                    )}
                  </View>
                </View>

                {/* Autenticação de Dois Fatores */}
                <View style={styles.securitySection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>🔑 Autenticação de Dois Fatores (2FA)</Text>
                  <Text style={[styles.securityDescription, { color: colors.textSecondary }]}>
                    Adicione uma camada extra de segurança com código SMS
                  </Text>
                  
                  <View style={[styles.securityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.securityItemContent}>
                      <Text style={styles.securityItemIcon}>📱</Text>
                      <View style={styles.securityItemText}>
                        <Text style={[styles.securityItemTitle, { color: colors.text }]}>2FA via SMS</Text>
                        <Text style={[styles.securityItemSubtitle, { color: colors.textSecondary }]}>
                          {twoFactorEnabled ? 'Código enviado por SMS' : 'Não configurado'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggle, twoFactorEnabled && styles.toggleActive]}
                      onPress={() => {
                        if (!twoFactorEnabled) {
                          Alert.alert(
                            '📱 Configurar 2FA',
                            'Enviaremos um código de 6 dígitos para o seu telefone cadastrado sempre que você fizer login.',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Ativar', onPress: () => {
                                setTwoFactorEnabled(true)
                                Alert.alert('✓ 2FA Ativado', 'Autenticação de dois fatores configurada!')
                              }}
                            ]
                          )
                        } else {
                          Alert.alert(
                            '⚠️ Desativar 2FA?',
                            'Isso diminuirá a segurança da sua conta.',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Desativar', style: 'destructive', onPress: () => setTwoFactorEnabled(false) }
                            ]
                          )
                        }
                      }}
                    >
                      <View style={[
                        styles.toggleThumb, 
                        twoFactorEnabled && styles.toggleThumbActive,
                        { backgroundColor: twoFactorEnabled ? '#fff' : '#9ca3af' }
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Google Authenticator */}
                <View style={styles.securitySection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>🔐 Google Authenticator</Text>
                  <Text style={[styles.securityDescription, { color: colors.textSecondary }]}>
                    Use o Google Authenticator para gerar códigos de verificação
                  </Text>
                  
                  <View style={[styles.securityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.securityItemContent}>
                      <Text style={styles.securityItemIcon}>🔑</Text>
                      <View style={styles.securityItemText}>
                        <Text style={[styles.securityItemTitle, { color: colors.text }]}>Google Auth</Text>
                        <Text style={[styles.securityItemSubtitle, { color: colors.textSecondary }]}>
                          {googleAuthEnabled ? 'Vinculado' : 'Não vinculado'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggle, googleAuthEnabled && styles.toggleActive]}
                      onPress={() => {
                        if (!googleAuthEnabled) {
                          Alert.alert(
                            '🔑 Configurar Google Auth',
                            'Você precisará escanear um QR Code com o app Google Authenticator.',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Configurar', onPress: () => {
                                setGoogleAuthEnabled(true)
                                Alert.alert('✓ Google Auth Configurado', 'Use o app para gerar códigos de acesso!')
                              }}
                            ]
                          )
                        } else {
                          Alert.alert(
                            '⚠️ Desvincular Google Auth?',
                            'Você não poderá mais usar códigos do Google Authenticator.',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Desvincular', style: 'destructive', onPress: () => setGoogleAuthEnabled(false) }
                            ]
                          )
                        }
                      }}
                    >
                      <View style={[
                        styles.toggleThumb, 
                        googleAuthEnabled && styles.toggleThumbActive,
                        { backgroundColor: googleAuthEnabled ? '#fff' : '#9ca3af' }
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bloqueio Automático */}
                <View style={styles.securitySection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>⏱️ Bloqueio Automático</Text>
                  <Text style={[styles.securityDescription, { color: colors.textSecondary }]}>
                    Bloqueia o app automaticamente após período de inatividade
                  </Text>
                  
                  <View style={[styles.securityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.securityItemContent}>
                      <Text style={styles.securityItemIcon}>🔒</Text>
                      <View style={styles.securityItemText}>
                        <Text style={[styles.securityItemTitle, { color: colors.text }]}>Bloqueio Automático</Text>
                        <Text style={[styles.securityItemSubtitle, { color: colors.textSecondary }]}>
                          {autoLockEnabled ? `Após ${autoLockTime} min de inatividade` : 'Desativado'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggle, autoLockEnabled && styles.toggleActive]}
                      onPress={() => {
                        if (!autoLockEnabled) {
                          setAutoLockEnabled(true)
                        } else {
                          Alert.alert(
                            '⏱️ Tempo de Bloqueio',
                            'Escolha após quanto tempo de inatividade bloquear:',
                            [
                              { text: '1 min', onPress: () => setAutoLockTime('1') },
                              { text: '5 min', onPress: () => setAutoLockTime('5') },
                              { text: '15 min', onPress: () => setAutoLockTime('15') },
                              { text: 'Desativar', style: 'destructive', onPress: () => setAutoLockEnabled(false) },
                            ]
                          )
                        }
                      }}
                    >
                      <View style={[
                        styles.toggleThumb, 
                        autoLockEnabled && styles.toggleThumbActive,
                        { backgroundColor: autoLockEnabled ? '#fff' : '#9ca3af' }
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Alertas de Login */}
                <View style={styles.securitySection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>🔔 Alertas de Segurança</Text>
                  <Text style={[styles.securityDescription, { color: colors.textSecondary }]}>
                    Receba notificações sobre acessos e atividades suspeitas
                  </Text>
                  
                  <View style={[styles.securityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.securityItemContent}>
                      <Text style={styles.securityItemIcon}>📧</Text>
                      <View style={styles.securityItemText}>
                        <Text style={[styles.securityItemTitle, { color: colors.text }]}>Alertas de Login</Text>
                        <Text style={[styles.securityItemSubtitle, { color: colors.textSecondary }]}>
                          {loginAlertsEnabled ? 'Notificações ativas' : 'Desativado'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.toggle, loginAlertsEnabled && styles.toggleActive]}
                      onPress={() => setLoginAlertsEnabled(!loginAlertsEnabled)}
                    >
                      <View style={[
                        styles.toggleThumb, 
                        loginAlertsEnabled && styles.toggleThumbActive,
                        { backgroundColor: loginAlertsEnabled ? '#fff' : '#9ca3af' }
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Ações Rápidas */}
                <View style={styles.securitySection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text }]}>⚡ Ações Rápidas</Text>
                  
                  <TouchableOpacity 
                    style={[styles.securityActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      Alert.alert(
                        '🔄 Alterar Senha',
                        'Você será direcionado para alterar sua senha.',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Continuar', onPress: () => Alert.alert('✓ Link Enviado', 'Enviamos um link para seu email.') }
                        ]
                      )
                    }}
                  >
                    <Text style={styles.securityActionIcon}>🔑</Text>
                    <Text style={[styles.securityActionText, { color: colors.text }]}>Alterar Senha</Text>
                    <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.securityActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      Alert.alert(
                        '📱 Dispositivos Conectados',
                        'Gerenciar dispositivos com acesso à sua conta.',
                        [
                          { text: 'Fechar', style: 'cancel' },
                          { text: 'Ver Dispositivos', onPress: () => Alert.alert('📱 Dispositivos', 'iPhone 14 Pro - Último acesso: Agora') }
                        ]
                      )
                    }}
                  >
                    <Text style={styles.securityActionIcon}>📱</Text>
                    <Text style={[styles.securityActionText, { color: colors.text }]}>Dispositivos Conectados</Text>
                    <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.securityActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      Alert.alert(
                        '📊 Histórico de Acessos',
                        'Visualizar todos os logins realizados.',
                        [
                          { text: 'Fechar', style: 'cancel' },
                          { text: 'Ver Histórico', onPress: () => Alert.alert('📊 Últimos Acessos', 'Hoje às 14:30 - São Paulo, Brasil') }
                        ]
                      )
                    }}
                  >
                    <Text style={styles.securityActionIcon}>📊</Text>
                    <Text style={[styles.securityActionText, { color: colors.text }]}>Histórico de Acessos</Text>
                    <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.securityActionButton, styles.securityActionDanger]}
                    onPress={() => {
                      Alert.alert(
                        '🚨 Revogar Todas as Sessões',
                        'Isso desconectará todos os dispositivos, incluindo este. Você precisará fazer login novamente.',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Revogar', style: 'destructive', onPress: () => Alert.alert('✓ Sessões Revogadas', 'Todas as sessões foram encerradas.') }
                        ]
                      )
                    }}
                  >
                    <Text style={styles.securityActionIcon}>🚨</Text>
                    <Text style={[styles.securityActionText, { color: '#ef4444' }]}>Revogar Todas as Sessões</Text>
                    <Text style={[styles.menuItemArrow, { color: '#ef4444' }]}>›</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.securityWarning, { backgroundColor: '#fef3c7', borderColor: '#fbbf24' }]}>
                  <Text style={styles.securityWarningIcon}>⚠️</Text>
                  <Text style={[styles.securityWarningText, { color: '#92400e' }]}>
                    <Text style={{ fontWeight: '500' }}>Dica de Segurança:{'\n'}</Text>
                    Ative múltiplas camadas de segurança para máxima proteção. Use biometria + 2FA + Google Auth para segurança ideal.
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setSecurityModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Salvar Configurações</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Notificações */}
      <NotificationsModal 
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />
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
  authProvider: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 8,
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
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "300",
  },
  menuItemArrow: {
    fontSize: 18,
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
  // Language Toggle
  languageToggle: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 4,
  },
  languageOption: {
    width: 44,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  languageOptionActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  flagIcon: {
    fontSize: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalOverlayDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "300",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalVersion: {
    fontSize: 13,
    fontWeight: "300",
  },
  modalBody: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 22,
    marginBottom: 12,
  },
  featureList: {
    marginTop: 8,
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 24,
    marginBottom: 6,
  },
  modalFooter: {
    fontSize: 13,
    fontWeight: "300",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  modalButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  modalButtonSecondary: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    flex: 1,
    marginRight: 8,
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  termsAcceptContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  privacyHighlight: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  privacyHighlightTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  privacyHighlightText: {
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 22,
  },
  // Security Modal Styles
  securitySection: {
    marginBottom: 24,
  },
  securityDescription: {
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 20,
    marginBottom: 12,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  securityItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  securityItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  securityItemText: {
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  securityItemSubtitle: {
    fontSize: 12,
    fontWeight: "300",
  },
  securityActionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  securityActionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  securityActionText: {
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  securityActionDanger: {
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
  },
  securityWarning: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  securityWarningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  securityWarningText: {
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 20,
    flex: 1,
  },
})

