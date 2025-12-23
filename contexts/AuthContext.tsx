import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'
import { secureStorage } from '@/lib/secure-storage'

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
        id: 'user_' + Date.now(),
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
      
      // TODO: Implementar OAuth com Google
      // Por enquanto, simulando
      const mockUser: User = {
        id: 'google_' + Date.now(),
        email: 'user@gmail.com',
        name: 'Google User',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
        authProvider: 'google'
      }
      
      await saveUser(mockUser)
      
      // Ativa o loading de dados após login bem-sucedido
      setIsLoadingData(true)
      
      // O loading será desativado pelo App.tsx quando os dados estiverem prontos
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
      // Por enquanto, simulando
      const mockUser: User = {
        id: 'apple_' + Date.now(),
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
        id: 'user_' + Date.now(),
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
