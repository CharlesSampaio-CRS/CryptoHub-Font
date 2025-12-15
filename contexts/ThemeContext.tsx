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
  background: '#0a1929',
  surface: '#1e293b',
  surfaceSecondary: '#334155',
  border: '#475569',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  primary: '#60a5fa',
  primaryDark: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  card: '#1e293b',
  cardBorder: '#334155',
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
