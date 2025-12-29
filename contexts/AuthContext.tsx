import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { secureStorage } from '@/lib/secure-storage'
import { config } from '@/lib/config'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  authProvider?: 'google' | 'apple' | 'email'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLoadingData: boolean
  isAuthenticated: boolean
  biometricAvailable: boolean
  biometricType: string | null
  
  // Auth methods
  login: (email: string, password: string) => Promise<void>
  loginWithBiometric: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  registerWithGoogle: () => Promise<void>
  registerWithApple: () => Promise<void>
  logout: () => Promise<void>
  
  // Loading control
  setLoadingDataComplete: () => void
  
  // Biometric settings
  enableBiometric: () => Promise<boolean>
  disableBiometric: () => Promise<void>
  isBiometricEnabled: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricType, setBiometricType] = useState<string | null>(null)
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false)

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability()
    checkBiometricEnabled()
    // Não carrega o usuário automaticamente - sempre começa pelo login
    setIsLoading(false)
  }, [])

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      
      if (compatible && enrolled) {
        setBiometricAvailable(true)
        
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID')
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID')
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris')
        }
      }
    } catch (error) {
      console.error('Error checking biometric:', error)
    }
  }

  const checkBiometricEnabled = async () => {
    try {
      const enabled = await secureStorage.getItemAsync('biometric_enabled')
      setIsBiometricEnabled(enabled === 'true')
    } catch (error) {
      console.error('Error checking biometric enabled:', error)
    }
  }

  // Função desabilitada - sistema sempre inicia no login
  // Pode ser reativada no futuro para implementar "lembrar-me"
  const loadUser = async () => {
    try {
      setIsLoading(true)
      const userData = await secureStorage.getItemAsync('user_data')
      
      if (userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveUser = async (userData: User) => {
    try {
      await secureStorage.setItemAsync('user_data', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Error saving user:', error)
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setIsLoadingData(true)
      
      // TODO: Implementar chamada real à API
      const mockUser: User = {
        id: 'charles_test_user', // ID fixo para desenvolvimento
        email,
        name: email.split('@')[0],
        authProvider: 'email'
      }
      
      await saveUser(mockUser)
    } catch (error) {
      console.error('Login error:', error)
      setIsLoadingData(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithBiometric = async () => {
    try {
      setIsLoading(true)
      
      if (!biometricAvailable || !isBiometricEnabled) {
        throw new Error('Biometric authentication not available or not enabled')
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Faça login com biometria',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      })

      if (result.success) {
        // Retrieve saved credentials and auto-login
        await loadUser()
        
        // Ativa o loading de dados após login bem-sucedido
        setIsLoadingData(true)
        
        // O loading será desativado pelo App.tsx quando os dados estiverem prontos
      } else {
        throw new Error('Biometric authentication failed')
      }
    } catch (error) {
      console.error('Biometric login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true)
      console.log('🔐 loginWithGoogle: Iniciando fluxo OAuth')
      
      // 1. Solicita URL de autenticação do Google via Kong
      console.log('📡 Requesting auth URL from:', `${config.kongBaseUrl}/auth/google`)
      const response = await fetch(`${config.kongBaseUrl}/auth/google`)
      
      if (!response.ok) {
        throw new Error(`Kong returned ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📨 Received auth URL:', data.auth_url ? '✅ OK' : '❌ Missing')
      
      if (!data.auth_url) {
        throw new Error('Failed to get Google auth URL')
      }
      
      console.log('🔐 Starting Google OAuth flow')
      
      // 2. Detecta se está rodando em web ou mobile
      const isWeb = Platform.OS === 'web'
      
      if (isWeb) {
        // Para web, usa popup com postMessage (transparente)
        console.log('🌐 Using WEB flow with popup')
        await new Promise<void>((resolve, reject) => {
          console.log('📝 Setting up message handler...')
          
          // Listener para mensagem do popup
          const messageHandler = async (event: MessageEvent) => {
            console.log('📬 Message received from popup:', event.data)
            
            if (event.data?.type === 'OAUTH_SUCCESS') {
              console.log('✅ OAUTH_SUCCESS detected!')
              window.removeEventListener('message', messageHandler)
              
              const { access_token, refresh_token, user_id, email, name } = event.data
              
              if (!access_token || !user_id || !email) {
                console.error('❌ Invalid OAuth data:', { access_token: !!access_token, user_id, email })
                window.removeEventListener('message', messageHandler)
                reject(new Error('Invalid OAuth response from Kong'))
                return
              }
              
              console.log('✅ OAuth successful! User:', { user_id, email })
              
              try {
                // Salva os tokens
                await secureStorage.setItemAsync('access_token', access_token)
                if (refresh_token) {
                  await secureStorage.setItemAsync('refresh_token', refresh_token)
                  console.log('💾 Refresh token saved - 30 day sessions enabled')
                }
                
                // Salva dados do usuário
                await secureStorage.setItemAsync('user_id', user_id)
                await secureStorage.setItemAsync('user_email', email)
                if (name) await secureStorage.setItemAsync('user_name', name)
                
                const user: User = {
                  id: user_id,
                  email: email,
                  name: name || email.split('@')[0],
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
                  authProvider: 'google'
                }
                
                await saveUser(user)
                setUser(user)
                setIsLoadingData(true)
                
                console.log('✅ User saved, resolving promise...')
                resolve()
              } catch (saveError) {
                console.error('❌ Error saving user data:', saveError)
                reject(saveError)
              }
            }
          }
          
          window.addEventListener('message', messageHandler)
          console.log('✅ Message handler registered')
          
          // Configuração otimizada do popup
          const width = 480
          const height = 620
          const left = Math.floor(window.screen.width / 2 - width / 2)
          const top = Math.floor(window.screen.height / 2 - height / 2)
          
          console.log('🪟 Opening popup:', { width, height, left, top })
          
          const popup = window.open(
            data.auth_url,
            'Google OAuth',
            `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0,resizable=1,scrollbars=1`
          )
          
          if (!popup) {
            console.error('❌ Failed to open popup - blocked by browser?')
            window.removeEventListener('message', messageHandler)
            reject(new Error('Failed to open OAuth popup - please allow popups'))
            return
          }
          
          console.log('✅ Popup opened successfully')
          
          try {
            popup.focus()
          } catch (e) {
            console.warn('Could not focus popup:', e)
          }
          
          // Monitora se o popup foi fechado
          console.log('👀 Starting popup monitor...')
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              console.log('🚪 Popup was closed by user')
              clearInterval(checkClosed)
              window.removeEventListener('message', messageHandler)
              reject(new Error('OAuth popup was closed'))
            }
          }, 500)
        })
      } else {
        // Para mobile, usa WebBrowser com deep link
        const redirectUri = 'exp://localhost:8081/--/auth/callback'
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.auth_url,
          redirectUri
        )
        
        if (result.type === 'success' && 'url' in result && result.url) {
          const url = new URL(result.url)
          const accessToken = url.searchParams.get('access_token')
          const refreshToken = url.searchParams.get('refresh_token')
          const userId = url.searchParams.get('user_id')
          const email = url.searchParams.get('email')
          const name = url.searchParams.get('name')
          
          if (!accessToken || !userId || !email) {
            throw new Error('Invalid OAuth response from Kong')
          }
          
          console.log('✅ OAuth successful! User:', { userId, email })
          
          await secureStorage.setItemAsync('access_token', accessToken)
          if (refreshToken) {
            await secureStorage.setItemAsync('refresh_token', refreshToken)
          }
          await secureStorage.setItemAsync('user_id', userId)
          await secureStorage.setItemAsync('user_email', email)
          if (name) await secureStorage.setItemAsync('user_name', name)
          
          const user: User = {
            id: userId,
            email: email,
            name: name || email.split('@')[0],
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
            authProvider: 'google'
          }
          
          await saveUser(user)
          setUser(user)
          setIsLoadingData(true)
        } else {
          throw new Error('OAuth cancelled or failed')
        }
      }
    } catch (error) {
      console.error('Google login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS')
      }
      
      setIsLoading(true)
      
      // TODO: Implementar OAuth com Apple
      // Por enquanto, usa o userId fixo do config para desenvolvimento
      const mockUser: User = {
        id: 'charles_test_user', // ID fixo para desenvolvimento
        email: 'user@icloud.com',
        name: 'Apple User',
        authProvider: 'apple'
      }
      
      await saveUser(mockUser)
      
      // Ativa o loading de dados após login bem-sucedido
      setIsLoadingData(true)
      
      // Aguarda um tick para garantir que isLoadingData seja propagado
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // O loading será desativado pelo App.tsx quando os dados estiverem prontos
    } catch (error) {
      console.error('Apple login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true)
      
      // TODO: Implementar chamada real à API
      const mockUser: User = {
        id: 'charles_test_user', // ID fixo para desenvolvimento
        email,
        name,
        authProvider: 'email'
      }
      
      await saveUser(mockUser)
    } catch (error) {
      console.error('Register error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const registerWithGoogle = async () => {
    // Mesma implementação do login com Google
    return loginWithGoogle()
  }

  const registerWithApple = async () => {
    // Mesma implementação do login com Apple
    return loginWithApple()
  }

  const logout = async () => {
    try {
      await secureStorage.deleteItemAsync('user_data')
      await secureStorage.deleteItemAsync('biometric_enabled')
      setUser(null)
      setIsBiometricEnabled(false)
      setIsLoadingData(false) // Reset loading state
    } catch (error) {
      console.error('❌ Logout error:', error)
      throw error
    }
  }

  const enableBiometric = async (): Promise<boolean> => {
    try {
      if (!biometricAvailable) {
        return false
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique para habilitar biometria',
        cancelLabel: 'Cancelar',
      })

      if (result.success) {
        await secureStorage.setItemAsync('biometric_enabled', 'true')
        setIsBiometricEnabled(true)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Enable biometric error:', error)
      return false
    }
  }

  const disableBiometric = async () => {
    try {
      await secureStorage.deleteItemAsync('biometric_enabled')
      setIsBiometricEnabled(false)
    } catch (error) {
      console.error('Disable biometric error:', error)
    }
  }

  const setLoadingDataComplete = () => {
    setIsLoadingData(false)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isLoadingData,
    isAuthenticated: !!user,
    biometricAvailable,
    biometricType,
    isBiometricEnabled,
    
    login,
    loginWithBiometric,
    loginWithGoogle,
    loginWithApple,
    register,
    registerWithGoogle,
    registerWithApple,
    logout,
    
    setLoadingDataComplete,
    
    enableBiometric,
    disableBiometric,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
