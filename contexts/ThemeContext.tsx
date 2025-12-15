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
  background: '#1e293b',      // Slate 800 - mais claro e suave
  surface: '#334155',         // Slate 700 - superfícies mais claras
  surfaceSecondary: '#475569', // Slate 600 - elementos secundários
  border: '#64748b',          // Slate 500 - bordas mais visíveis
  text: '#f8fafc',            // Slate 50 - texto bem claro
  textSecondary: '#e2e8f0',   // Slate 200 - secundário mais visível
  primary: '#60a5fa',         // Blue 400 - primário mais claro
  primaryDark: '#3b82f6',     // Blue 500
  success: '#34d399',         // Green 400 - verde mais claro
  danger: '#f87171',          // Red 400 - vermelho mais suave
  warning: '#fbbf24',         // Amber 400 - amarelo mais claro
  card: '#334155',            // Slate 700 - cards mais claros
  cardBorder: '#475569',      // Slate 600 - bordas suaves
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
