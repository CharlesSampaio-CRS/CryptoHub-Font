import { 
  Text, 
  StyleSheet, 
  ScrollView, 
  View, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Pressable, 
  Platform,
  KeyboardAvoidingView
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import * as Clipboard from 'expo-clipboard'
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useAuth } from "../contexts/AuthContext"
import { NotificationsModal } from "../components/NotificationsModal"
import { LogoIcon } from "../components/LogoIcon"
import Svg, { Path, Circle } from "react-native-svg"

export function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const { 
    biometricAvailable, 
    biometricType, 
    isBiometricEnabled,
    enableBiometric,
    disableBiometric
  } = useAuth()
  
  // Estados dos modais
  const [aboutModalVisible, setAboutModalVisible] = useState(false)
  const [termsModalVisible, setTermsModalVisible] = useState(false)
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false)
  const [securityModalVisible, setSecurityModalVisible] = useState(false)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false)
  
  // Estados de segurança  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)
  const [autoLockTime, setAutoLockTime] = useState('5') // minutos
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true)
  const [deviceIp, setDeviceIp] = useState<string>('Carregando...')

  // Busca o IP público do dispositivo ao abrir o modal de segurança
  useEffect(() => {
    if (securityModalVisible) {
      fetchDeviceIp()
    }
  }, [securityModalVisible])

  const fetchDeviceIp = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      setDeviceIp(data.ip)
    } catch (error) {
      console.error('Error fetching IP:', error)
      setDeviceIp('Não disponível')
    }
  }

  const handleCopyIp = () => {
    Clipboard.setString(deviceIp)
    Alert.alert('✓', 'IP copiado para área de transferência')
  }

  const handleBiometricToggle = async () => {
    try {
      if (isBiometricEnabled) {
        await disableBiometric()
        Alert.alert('✓', `${biometricType} desativado com sucesso`)
      } else {
        await enableBiometric()
        Alert.alert('✓', `${biometricType} ativado com sucesso`)
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao configurar biometria')
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LogoIcon size={24} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('settings.subtitle')}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção: Aparência */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.appearance')}</Text>
          
          {/* Dark Mode */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginBottom: 12 }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.darkMode')}</Text>
                <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
                  {theme === 'dark' ? t('settings.activated') : t('settings.deactivated')}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.toggle,
                { backgroundColor: theme === 'dark' ? colors.toggleActive : colors.toggleInactive }
              ]}
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.toggleThumb,
                { backgroundColor: colors.toggleThumb },
                theme === 'dark' && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção: Notificações */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.notificationsSection')}</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setNotificationsModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.notifications')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Segurança */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.securityPrivacySection')}</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setSecurityModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.security')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          {/* Biometria */}
          {biometricAvailable && (
            <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginTop: 12 }]}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      stroke={colors.text}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx="12" cy="9" r="2.5" stroke={colors.text} strokeWidth="2" />
                  </Svg>
                </View>
                <View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>{biometricType}</Text>
                  <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
                    {isBiometricEnabled ? 'Ativado' : 'Desativado'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[
                  styles.toggle,
                  { backgroundColor: isBiometricEnabled ? colors.toggleActive : colors.toggleInactive }
                ]}
                onPress={handleBiometricToggle}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.toggleThumb,
                  { backgroundColor: colors.toggleThumb },
                  isBiometricEnabled && styles.toggleThumbActive
                ]} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção: Sobre */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.infoSectionTitle')}</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setAboutModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke={colors.text} strokeWidth="2" />
                  <Path d="M12 16v-4M12 8h.01" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.aboutApp')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginTop: 12 }]}
            onPress={() => setTermsModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.termsOfUse')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginTop: 12, marginBottom: 12 }]}
            onPress={() => setPrivacyModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4"
                    stroke={colors.text}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.privacyPolicy')}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Conta */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.accountSection')}</Text>
          
          <TouchableOpacity 
            style={[styles.deleteAccountButton, { backgroundColor: colors.surface, borderColor: colors.danger }]}
            onPress={() => setDeleteAccountModalVisible(true)}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"
                stroke={colors.danger}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.deleteAccountButtonText, { color: colors.danger }]}>{t('settings.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modais */}
      <NotificationsModal 
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
      />

      {/* Modal de Segurança */}
      <Modal
        visible={securityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={[styles.securityModalContainer, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.securityModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.securityModalTitle, { color: colors.text }]}>
                  {t('profile.security')}
                </Text>
                <TouchableOpacity onPress={() => setSecurityModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={[styles.modalCloseIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView 
                style={styles.securityModalContent} 
                contentContainerStyle={styles.securityModalContentContainer}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Autenticação de Dois Fatores</Text>
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>2FA via SMS</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Receba códigos de verificação por SMS
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.toggle,
                    { backgroundColor: twoFactorEnabled ? colors.toggleActive : colors.toggleInactive }
                  ]}
                  onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.toggleThumb,
                    { backgroundColor: colors.toggleThumb },
                    twoFactorEnabled && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>

              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Google Authenticator</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Use o app Google Authenticator
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.toggle,
                    { backgroundColor: googleAuthEnabled ? colors.toggleActive : colors.toggleInactive }
                  ]}
                  onPress={() => setGoogleAuthEnabled(!googleAuthEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.toggleThumb,
                    { backgroundColor: colors.toggleThumb },
                    googleAuthEnabled && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Bloqueio Automático</Text>
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Ativar Bloqueio</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Bloquear app após inatividade
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.toggle,
                    { backgroundColor: autoLockEnabled ? colors.toggleActive : colors.toggleInactive }
                  ]}
                  onPress={() => setAutoLockEnabled(!autoLockEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.toggleThumb,
                    { backgroundColor: colors.toggleThumb },
                    autoLockEnabled && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>

              {autoLockEnabled && (
                <View style={[styles.timeSelector, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Tempo de Inatividade</Text>
                  <View style={styles.timeOptions}>
                    {['1', '5', '10', '30'].map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeOption,
                          { 
                            backgroundColor: autoLockTime === time ? colors.primary : colors.surface,
                            borderColor: autoLockTime === time ? colors.primary : colors.border 
                          }
                        ]}
                        onPress={() => setAutoLockTime(time)}
                      >
                        <Text style={[styles.timeOptionText, { color: autoLockTime === time ? '#fff' : colors.text }]}>
                          {time}min
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Alertas</Text>
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Alertas de Login</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Notificar sobre novos logins
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[
                    styles.toggle,
                    { backgroundColor: loginAlertsEnabled ? colors.toggleActive : colors.toggleInactive }
                  ]}
                  onPress={() => setLoginAlertsEnabled(!loginAlertsEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.toggleThumb,
                    { backgroundColor: colors.toggleThumb },
                    loginAlertsEnabled && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Informações do Dispositivo</Text>
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>IP Público</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Use este IP para whitelist nas exchanges
                  </Text>
                  <View style={styles.ipRow}>
                    <View style={[styles.ipContainer, { backgroundColor: colors.surfaceSecondary, borderWidth: 0.5, borderColor: colors.border, flex: 1 }]}>
                      <Text style={[styles.ipText, { color: colors.text }]}>{deviceIp}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.copyButton, { backgroundColor: colors.primary }]}
                      onPress={handleCopyIp}
                      activeOpacity={0.7}
                      disabled={deviceIp === 'Carregando...' || deviceIp === 'Não disponível'}
                    >
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <Path 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                          stroke={colors.textInverse} 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={[styles.infoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.infoIconYellow}>i</Text>
                </View>
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Ao criar APIs nas exchanges, adicione este IP na whitelist para maior segurança
                </Text>
              </View>
            </View>
          </ScrollView>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Sobre o App */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={[styles.aboutModalContainer, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.aboutModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.aboutModalTitle, { color: colors.text }]}>
                  Sobre o App
                </Text>
                <TouchableOpacity onPress={() => setAboutModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={[styles.modalCloseIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView 
                style={styles.aboutModalContent} 
                contentContainerStyle={styles.aboutModalContentContainer}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.aboutContent}>
                  <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Versão 1.0.0</Text>
                  <Text style={[styles.aboutText, { color: colors.text }]}>
                    CryptoHub é um agregador de exchanges de criptomoedas que permite você gerenciar todas as suas
                    carteiras em um único lugar.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Termos de Uso */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={[styles.termsModalContainer, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.termsModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.termsModalTitle, { color: colors.text }]}>
                  Termos de Uso
                </Text>
                <TouchableOpacity onPress={() => setTermsModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={[styles.modalCloseIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView 
                style={styles.termsModalContent} 
                contentContainerStyle={styles.termsModalContentContainer}
                showsVerticalScrollIndicator={true}
              >
                <Text style={[styles.termsText, { color: colors.text }]}>
                  [Conteúdo dos Termos de Uso aqui]
                </Text>
              </ScrollView>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Política de Privacidade */}
      <Modal
        visible={privacyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Política de Privacidade</Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.termsText, { color: colors.text }]}>
              [Conteúdo da Política de Privacidade aqui]
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de Confirmação de Exclusão de Conta */}
      <Modal
        visible={deleteAccountModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={[styles.deleteAccountModalContainer, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.deleteAccountModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.deleteAccountModalTitle, { color: colors.danger }]}>⚠️ {t('settings.deleteAccount')}</Text>
                <TouchableOpacity 
                  onPress={() => setDeleteAccountModalVisible(false)} 
                  style={styles.modalCloseButton}
                >
                  <Text style={[styles.modalCloseIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.deleteAccountModalContent}>
                <Text style={[styles.deleteAccountWarningText, { color: colors.text }]}>
                  Esta ação é <Text style={{ fontWeight: '700', color: colors.danger }}>irreversível</Text> e resultará em:
                </Text>

                <View style={styles.deleteAccountWarningList}>
                  <View style={styles.deleteAccountWarningItem}>
                    <Text style={[styles.deleteAccountWarningBullet, { color: colors.danger }]}>•</Text>
                    <Text style={[styles.deleteAccountWarningItemText, { color: colors.textSecondary }]}>
                      Perda permanente de todos os seus dados
                    </Text>
                  </View>
                  <View style={styles.deleteAccountWarningItem}>
                    <Text style={[styles.deleteAccountWarningBullet, { color: colors.danger }]}>•</Text>
                    <Text style={[styles.deleteAccountWarningItemText, { color: colors.textSecondary }]}>
                      Desconexão de todas as exchanges vinculadas
                    </Text>
                  </View>
                  <View style={styles.deleteAccountWarningItem}>
                    <Text style={[styles.deleteAccountWarningBullet, { color: colors.danger }]}>•</Text>
                    <Text style={[styles.deleteAccountWarningItemText, { color: colors.textSecondary }]}>
                      Perda do histórico de transações e estratégias
                    </Text>
                  </View>
                  <View style={styles.deleteAccountWarningItem}>
                    <Text style={[styles.deleteAccountWarningBullet, { color: colors.danger }]}>•</Text>
                    <Text style={[styles.deleteAccountWarningItemText, { color: colors.textSecondary }]}>
                      Impossibilidade de recuperação dos dados
                    </Text>
                  </View>
                </View>

                <Text style={[styles.deleteAccountConfirmText, { color: colors.text }]}>
                  Tem certeza que deseja continuar?
                </Text>

                {/* Botões */}
                <View style={styles.deleteAccountModalButtons}>
                  <TouchableOpacity
                    style={[styles.deleteAccountCancelButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                    onPress={() => setDeleteAccountModalVisible(false)}
                  >
                    <Text style={[styles.deleteAccountCancelButtonText, { color: colors.primary }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteAccountConfirmButton, { backgroundColor: colors.surface, borderColor: colors.danger }]}
                    onPress={async () => {
                      if (Platform.OS === 'web') {
                        const confirmed = window.confirm(
                          'ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n' +
                          'Digite "EXCLUIR" para confirmar a exclusão da conta:'
                        )
                        if (confirmed) {
                          // Aqui você implementaria a lógica de exclusão
                          setDeleteAccountModalVisible(false)
                          Alert.alert('✓', 'Conta excluída com sucesso')
                        }
                      } else {
                        Alert.alert(
                          '⚠️ Confirmar Exclusão',
                          'ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTem certeza absoluta que deseja excluir sua conta?',
                          [
                            {
                              text: 'Cancelar',
                              style: 'cancel'
                            },
                            {
                              text: 'Excluir',
                              style: 'destructive',
                              onPress: async () => {
                                // Aqui você implementaria a lógica de exclusão
                                setDeleteAccountModalVisible(false)
                                Alert.alert('✓', 'Conta excluída com sucesso')
                              }
                            }
                          ]
                        )
                      }
                    }}
                  >
                    <Text style={[styles.deleteAccountConfirmButtonText, { color: colors.danger }]}>
                      Excluir Permanentemente
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerText: {
    flexDirection: "column",
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
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "400",
  },
  menuItemSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  menuItemArrow: {
    fontSize: 24,
    fontWeight: "300",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "400",
  },
  modalClose: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "400",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  timeSelector: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  timeOptions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  timeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  timeOptionText: {
    fontSize: 13,
    fontWeight: "400",
  },
  aboutContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  // Toggle Button
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  ipContainer: {
    padding: 12,
    borderRadius: 8,
    opacity: 0.8,
  },
  ipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  ipText: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    opacity: 0.8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFA500",
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconYellow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoText: {
    fontSize: 11,
    fontWeight: "300",
    lineHeight: 16,
    flex: 1,
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Security Modal Styles (following CreateStrategyModal pattern)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSafeArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  securityModalContainer: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    height: "85%",
  },
  securityModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  securityModalTitle: {
    fontSize: 20,
    fontWeight: "500",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseIcon: {
    fontSize: 24,
    fontWeight: "300",
  },
  securityModalContent: {
    flex: 1,
  },
  securityModalContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  // About Modal Styles (following CreateStrategyModal pattern)
  aboutModalContainer: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    height: "85%",
  },
  aboutModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  aboutModalTitle: {
    fontSize: 20,
    fontWeight: "500",
  },
  aboutModalContent: {
    flex: 1,
  },
  aboutModalContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  // Terms Modal Styles (following CreateStrategyModal pattern)
  termsModalContainer: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    height: "85%",
  },
  termsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  termsModalTitle: {
    fontSize: 20,
    fontWeight: "500",
  },
  termsModalContent: {
    flex: 1,
  },
  termsModalContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  // Delete Account Modal Styles
  deleteAccountModalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    borderRadius: 16,
    overflow: "hidden",
  },
  deleteAccountModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  deleteAccountModalTitle: {
    fontSize: 20,
    fontWeight: "500",
  },
  deleteAccountModalContent: {
    padding: 20,
  },
  deleteAccountWarningText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  deleteAccountWarningList: {
    marginBottom: 20,
  },
  deleteAccountWarningItem: {
    flexDirection: "row",
    marginBottom: 12,
    paddingLeft: 8,
  },
  deleteAccountWarningBullet: {
    fontSize: 18,
    marginRight: 12,
    fontWeight: "700",
  },
  deleteAccountWarningItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteAccountConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  deleteAccountModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  deleteAccountCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  deleteAccountCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteAccountConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  deleteAccountConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})

