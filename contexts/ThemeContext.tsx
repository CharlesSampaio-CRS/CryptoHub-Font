import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = '@cryptohub:theme'

interface ThemeColors {
  // Backgrounds
  background: string
  surface: string
  surfaceSecondary: string
  surfaceHover: string  // Para hover states
  
  // Borders
  border: string
  borderLight: string
  
  // Text
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string  // Texto em fundos escuros (sempre branco)
  
  // Primary Colors
  primary: string
  primaryDark: string
  primaryLight: string
  primaryText: string  // Texto sobre fundo azul
  
  // Semantic Colors
  success: string
  successLight: string
  danger: string
  dangerLight: string
  warning: string
  warningLight: string
  info: string
  infoLight: string
  
  // Component Specific
  card: string
  cardBorder: string
  input: string
  inputBorder: string
  badge: string
  badgeBorder: string
  
  // Toggle/Switch
  toggleInactive: string
  toggleActive: string
  toggleThumb: string
  
  // Tab
  tabInactive: string
  tabActive: string
  tabText: string
  tabTextActive: string
}

interface ThemeContextType {
  theme: Theme
  colors: ThemeColors
  isDark: boolean
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const lightColors: ThemeColors = {
  // Backgrounds
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceSecondary: '#f9fafb',
  surfaceHover: '#f3f4f6',
  
  // Borders  
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  // Text
  text: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // Primary Colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  primaryText: '#ffffff',
  
  // Semantic Colors
  success: '#10b981',
  successLight: '#d1fae5',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  
  // Component Specific
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  input: '#ffffff',
  inputBorder: '#d1d5db',
  badge: '#f3f4f6',
  badgeBorder: '#d1d5db',
  
  // Toggle/Switch
  toggleInactive: '#e5e7eb',
  toggleActive: '#3b82f6',
  toggleThumb: '#ffffff',
  
  // Tab
  tabInactive: '#f3f4f6',
  tabActive: '#3b82f6',
  tabText: '#6b7280',
  tabTextActive: '#ffffff',
}

const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0a0a0a',
  surface: '#1f1f1f',
  surfaceSecondary: '#2a2a2a',
  surfaceHover: '#2a2a2a',
  
  // Borders
  border: '#525252',
  borderLight: '#404040',
  
  // Text
  text: '#fafafa',
  textSecondary: '#c4c4c4',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // Primary Colors
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  primaryText: '#ffffff',
  
  // Semantic Colors
  success: '#10b981',
  successLight: '#065f46',
  danger: '#ef4444',
  dangerLight: '#7f1d1d',
  warning: '#f59e0b',
  warningLight: '#78350f',
  info: '#3b82f6',
  infoLight: '#1e3a8a',
  
  // Component Specific
  card: '#1f1f1f',
  cardBorder: '#525252',
  input: '#2a2a2a',
  inputBorder: '#6b7280',
  badge: '#2a2a2a',
  badgeBorder: '#525252',
  
  // Toggle/Switch
  toggleInactive: '#404040',
  toggleActive: '#3b82f6',
  toggleThumb: '#ffffff',
  
  // Tab
  tabInactive: '#2a2a2a',
  tabActive: '#3b82f6',
  tabText: '#c4c4c4',
  tabTextActive: '#ffffff',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light') // Default to light
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme)
        }
      } catch (error) {
        console.error('Error loading theme:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  // Memoize colors to prevent recreation on every render
  const colors = useMemo(() => 
    theme === 'light' ? lightColors : darkColors, 
    [theme]
  )

  // Memoize setTheme to maintain stable reference and save to storage
  const handleSetTheme = useCallback(async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme)
      setTheme(newTheme)
    } catch (error) {
      console.error('Error saving theme:', error)
      // Still update the state even if storage fails
      setTheme(newTheme)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    colors,
    isDark: theme === 'dark',
    setTheme: handleSetTheme,
    isLoading
  }), [theme, colors, handleSetTheme, isLoading])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
