import React, { createContext, useContext, useState } from 'react'

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
  background: '#ffffff',
  surface: '#ffffff',
  surfaceSecondary: '#f8f9fa',
  border: '#e9ecef',
  text: '#212529',
  textSecondary: '#868e96',
  primary: '#10b981',
  primaryDark: '#059669',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  card: '#ffffff',
  cardBorder: '#f1f3f5',
}

const darkColors: ThemeColors = {
  background: '#0f0f0f',
  surface: '#1a1a1a',
  surfaceSecondary: '#262626',
  border: '#2a2a2a',
  text: '#fafafa',
  textSecondary: '#a3a3a3',
  primary: '#10b981',
  primaryDark: '#059669',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  card: '#1a1a1a',
  cardBorder: '#262626',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light') // Default to light

  const colors = theme === 'light' ? lightColors : darkColors

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
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
