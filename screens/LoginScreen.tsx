import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import Svg, { Path, Circle, Line, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LinearGradient } from 'expo-linear-gradient'
import { AnimatedLogoIcon } from '@/components/AnimatedLogoIcon'

interface LoginScreenProps {
  navigation: any
}

// MultExchanges Logo
const LogoIcon = () => (
  <Svg width="80" height="80" viewBox="0 0 1024 1024" fill="none">
    <Defs>
      <Filter id="glow">
        <FeGaussianBlur stdDeviation="10" result="coloredBlur"/>
        <FeMerge>
          <FeMergeNode in="coloredBlur"/>
          <FeMergeNode in="SourceGraphic"/>
        </FeMerge>
      </Filter>
    </Defs>
    
    {/* Central Hub Circle */}
    <Circle cx="512" cy="512" r="140" fill="#FFC107" filter="url(#glow)"/>
    <Circle cx="512" cy="512" r="100" fill="#F59E0B"/>
    
    {/* Connection lines */}
    <Line x1="512" y1="412" x2="512" y2="220" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
    <Line x1="612" y1="512" x2="804" y2="512" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
    <Line x1="512" y1="612" x2="512" y2="804" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
    <Line x1="412" y1="512" x2="220" y2="512" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
    
    {/* Diagonal connections */}
    <Line x1="598" y1="426" x2="738" y2="286" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
    <Line x1="598" y1="598" x2="738" y2="738" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
    <Line x1="426" y1="598" x2="286" y2="738" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
    <Line x1="426" y1="426" x2="286" y2="286" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
    
    {/* Satellite Nodes */}
    <Circle cx="512" cy="200" r="70" fill="#3B82F6" filter="url(#glow)"/>
    <Circle cx="512" cy="200" r="50" fill="#2563EB"/>
    
    <Circle cx="824" cy="512" r="70" fill="#3B82F6" filter="url(#glow)"/>
    <Circle cx="824" cy="512" r="50" fill="#2563EB"/>
    
    <Circle cx="512" cy="824" r="70" fill="#3B82F6" filter="url(#glow)"/>
    <Circle cx="512" cy="824" r="50" fill="#2563EB"/>
    
    <Circle cx="200" cy="512" r="70" fill="#3B82F6" filter="url(#glow)"/>
    <Circle cx="200" cy="512" r="50" fill="#2563EB"/>
    
    {/* Corner nodes */}
    <Circle cx="268" cy="268" r="50" fill="#3B82F6" opacity="0.8"/>
    <Circle cx="756" cy="268" r="50" fill="#3B82F6" opacity="0.8"/>
    <Circle cx="756" cy="756" r="50" fill="#3B82F6" opacity="0.8"/>
    <Circle cx="268" cy="756" r="50" fill="#3B82F6" opacity="0.8"/>
  </Svg>
)

// Google Icon Component
const GoogleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
)

// Apple Icon Component
const AppleIcon = ({ color = "#000000" }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
    <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </Svg>
)

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors, isDark } = useTheme()
  const { t } = useLanguage()
  const {
    login,
    loginWithBiometric,
    loginWithGoogle,
    loginWithApple,
    biometricAvailable,
    biometricType,
    isBiometricEnabled,
    isLoading,
    isLoadingData,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isFullLoading = isLoading || isLoadingData

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('error.fillAllFields'))
      return
    }

    try {
      await login(email, password)
    } catch (error: any) {
      console.error('❌ Erro no login:', error)
      Alert.alert(t('common.error'), error.message || t('error.loginFailed'))
    }
  }

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometric()
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('error.biometricFailed'))
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao fazer login com Google')
    }
  }

  const handleAppleLogin = async () => {
    try {
      await loginWithApple()
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao fazer login com Apple')
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 60,
      paddingBottom: 40,
      paddingHorizontal: 24,
      backgroundColor: colors.background,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    logo: {
      fontSize: 48,
      marginBottom: 16,
      textAlign: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '300',
      letterSpacing: -0.2,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '300',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordInput: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: colors.text,
    },
    showPasswordButton: {
      padding: 16,
    },
    showPasswordText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: '#3b82f6',
      fontSize: 14,
      fontWeight: '400',
    },
    loginButton: {
      borderRadius: 12,
      borderWidth: 2,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: '#3b82f6',
      fontSize: 15,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      color: colors.textSecondary,
      fontSize: 14,
    },
    biometricButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    biometricIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    biometricButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '400',
    },
    socialButtons: {
      gap: 12,
      marginBottom: 24,
    },
    socialButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    socialButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '400',
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
      paddingBottom: 32,
    },
    signupText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    signupLink: {
      color: '#3b82f6',
      fontSize: 14,
      fontWeight: '400',
      marginLeft: 4,
    },
  })

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LogoIcon />
          </View>
          <Text style={styles.title}>Bem vindo!</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
        </View>

        <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isFullLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isFullLoading}
            />
            <TouchableOpacity
              style={styles.showPasswordButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPasswordText}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.loginButton, 
            { backgroundColor: colors.surface, borderColor: '#3b82f6' },
            isFullLoading && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={isFullLoading}
        >
          {isFullLoading ? (
            <AnimatedLogoIcon size={24} />
          ) : (
            <Text style={styles.loginButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        {biometricAvailable && isBiometricEnabled && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isFullLoading}
            >
              <Text style={styles.biometricIcon}>
                {biometricType === 'Face ID' ? '👤' : '👆'}
              </Text>
              <Text style={styles.biometricButtonText}>
                Entrar com {biometricType}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}
            disabled={isFullLoading}
          >
            <GoogleIcon />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: isDark ? '#ffffff' : '#000000' }]}
              onPress={handleAppleLogin}
              disabled={isFullLoading}
            >
              <AppleIcon color={isDark ? '#000000' : '#ffffff'} />
              <Text style={[styles.socialButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>
                Apple
              </Text>
            </TouchableOpacity>
          )}
        </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
