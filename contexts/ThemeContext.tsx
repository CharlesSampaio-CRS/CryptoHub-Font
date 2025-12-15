import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeColors {
  background: string
  surface: string
  surfaceSecondary: string
  border: string
  text: string
  textSecondary: string
  primary: string
  primaryDark: string
  success: string
  danger: string
  warning: string
  card: string
  cardBorder: string
}

interface ThemeContextType {
  theme: Theme
  colors: ThemeColors
  isDark: boolean
  setTheme: (theme: Theme) => void
}

const lightColors: ThemeColors = {
  background: '#f0f7ff',
  surface: '#ffffff',
  surfaceSecondary: '#e3f2fd',
  border: '#bbdefb',
  text: '#1e3a5f',
  textSecondary: '#64748b',
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  card: '#ffffff',
  cardBorder: '#e0f2fe',
}

const darkColors: ThemeColors = {
  background: '#0f172a',      // Slate 900 - fundo escuro mas sofisticado
  surface: '#1e293b',         // Slate 800 - superfícies mais escuras
  surfaceSecondary: '#334155', // Slate 700 - elementos secundários
  border: '#475569',          // Slate 600 - bordas sutis e elegantes
  text: '#f1f5f9',            // Slate 100 - texto super claro
  textSecondary: '#cbd5e1',   // Slate 300 - secundário bem visível
  primary: '#60a5fa',         // Blue 400 - primário vibrante
  primaryDark: '#3b82f6',     // Blue 500
  success: '#34d399',         // Green 400 - verde claro
  danger: '#f87171',          // Red 400 - vermelho suave
  warning: '#fbbf24',         // Amber 400 - amarelo claro
  card: '#1e293b',            // Slate 800 - cards escuros elegantes
  cardBorder: '#334155',      // Slate 700 - bordas dos cards sutis
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light') // Default to light

  // Memoize colors to prevent recreation on every render
  const colors = useMemo(() => 
    theme === 'light' ? lightColors : darkColors, 
    [theme]
  )

  // Memoize setTheme to maintain stable reference
  const handleSetTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    colors,
    isDark: theme === 'dark',
    setTheme: handleSetTheme
  }), [theme, colors, handleSetTheme])

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
