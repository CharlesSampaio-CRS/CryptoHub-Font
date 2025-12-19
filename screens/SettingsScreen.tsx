import { Text, StyleSheet, ScrollView, View, TouchableOpacity, Alert, Modal, Pressable, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import * as Clipboard from 'expo-clipboard'
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useAuth } from "../contexts/AuthContext"
import { NotificationsModal } from "../components/NotificationsModal"
import Svg, { Path, Circle } from "react-native-svg"

export function SettingsScreen() {
  const { theme, setTheme, colors } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const { 
    biometricAvailable, 
    biometricType, 
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    logout
  } = useAuth()
  
  // Estados dos modais
  const [aboutModalVisible, setAboutModalVisible] = useState(false)
  const [termsModalVisible, setTermsModalVisible] = useState(false)
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false)
  const [securityModalVisible, setSecurityModalVisible] = useState(false)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)
  
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
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('settings.subtitle')}</Text>
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
              style={[styles.toggle, theme === 'dark' && styles.toggleActive]}
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleThumb, theme === 'dark' && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Idioma */}
          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.surface }]}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke={colors.text} strokeWidth="2" />
                  <Path
                    d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                    stroke={colors.text}
                    strokeWidth="2"
                  />
                </Svg>
              </View>
              <View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t('profile.language')}</Text>
                <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
                  {language === 'pt-BR' ? 'Português' : 'English'}
                </Text>
              </View>
            </View>
            <View style={styles.languageButtons}>
              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  { borderColor: colors.border },
                  language === 'pt-BR' && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setLanguage('pt-BR')}
              >
                <Text style={[styles.languageButtonText, { color: language === 'pt-BR' ? '#fff' : colors.text }]}>PT</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  { borderColor: colors.border },
                  language === 'en-US' && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setLanguage('en-US')}
              >
                <Text style={[styles.languageButtonText, { color: language === 'en-US' ? '#fff' : colors.text }]}>EN</Text>
              </TouchableOpacity>
            </View>
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SEGURANÇA E PRIVACIDADE</Text>
          
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
                style={[styles.toggle, isBiometricEnabled && styles.toggleActive]}
                onPress={handleBiometricToggle}
                activeOpacity={0.7}
              >
                <View style={[styles.toggleThumb, isBiometricEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção: Sobre */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INFORMAÇÕES</Text>
          
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTA</Text>
          
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#ef4444' }]}
            onPress={async () => {
              console.log('🔘 Botão de logout clicado')
              
              // Para web, usa confirm nativo
              if (Platform.OS === 'web') {
                const confirmed = window.confirm(t('profile.logoutConfirm'))
                console.log('🔍 Confirmação web:', confirmed)
                
                if (confirmed) {
                  try {
                    console.log('✅ Logout confirmado, chamando logout()...')
                    await logout()
                    console.log('✅ Logout() retornou com sucesso')
                  } catch (error) {
                    console.error('❌ Erro ao fazer logout:', error)
                    window.alert('Não foi possível realizar o logout')
                  }
                } else {
                  console.log('❌ Logout cancelado')
                }
              } else {
                // Para mobile, usa Alert
                Alert.alert(
                  t('profile.logout'),
                  t('profile.logoutConfirm'),
                  [
                    { 
                      text: t('common.cancel'), 
                      style: 'cancel',
                      onPress: () => console.log('❌ Logout cancelado')
                    },
                    {
                      text: t('common.confirm'),
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          console.log('✅ Logout confirmado, chamando logout()...')
                          await logout()
                          console.log('✅ Logout() retornou com sucesso')
                        } catch (error) {
                          console.error('❌ Erro ao fazer logout:', error)
                          Alert.alert(t('common.error'), 'Não foi possível realizar o logout')
                        }
                      }
                    }
                  ]
                )
              }
            }}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
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
        presentationStyle="pageSheet"
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Segurança</Text>
            <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
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
                  style={[styles.toggle, twoFactorEnabled && styles.toggleActive]}
                  onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.toggleThumb, twoFactorEnabled && styles.toggleThumbActive]} />
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
                  style={[styles.toggle, googleAuthEnabled && styles.toggleActive]}
                  onPress={() => setGoogleAuthEnabled(!googleAuthEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.toggleThumb, googleAuthEnabled && styles.toggleThumbActive]} />
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
                  style={[styles.toggle, autoLockEnabled && styles.toggleActive]}
                  onPress={() => setAutoLockEnabled(!autoLockEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.toggleThumb, autoLockEnabled && styles.toggleThumbActive]} />
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
                          { borderColor: colors.border },
                          autoLockTime === time && { backgroundColor: colors.primary, borderColor: colors.primary }
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
                  style={[styles.toggle, loginAlertsEnabled && styles.toggleActive]}
                  onPress={() => setLoginAlertsEnabled(!loginAlertsEnabled)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.toggleThumb, loginAlertsEnabled && styles.toggleThumbActive]} />
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
                  <View style={styles.ipContainer}>
                    <Text style={[styles.ipText, { color: colors.primary }]}>{deviceIp}</Text>
                  </View>
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
                      stroke="#ffffff" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
              <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                <Text style={[styles.infoText, { color: colors.primary }]}>
                  💡 Ao criar APIs nas exchanges, adicione este IP na whitelist para maior segurança
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal Sobre o App */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sobre o App</Text>
            <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.aboutContent}>
              <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Versão 1.0.0</Text>
              <Text style={[styles.aboutText, { color: colors.text }]}>
                CryptoHub é um agregador de exchanges de criptomoedas que permite você gerenciar todas as suas
                carteiras em um único lugar.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal Termos de Uso */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Termos de Uso</Text>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.termsText, { color: colors.text }]}>
              [Conteúdo dos Termos de Uso aqui]
            </Text>
          </ScrollView>
        </SafeAreaView>
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
  languageButtons: {
    flexDirection: "row",
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  languageButtonText: {
    fontSize: 13,
    fontWeight: "400",
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
    backgroundColor: "#d4d4d4",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#3b82f6",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  ipContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  ipText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#ef4444",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
})

