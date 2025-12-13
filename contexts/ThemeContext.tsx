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
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceSecondary: '#f3f4f6',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  primary: '#10b981',
  primaryDark: '#059669',
  success: '#10b981',
  danger: '#dc2626',
  warning: '#f59e0b',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
}

const darkColors: ThemeColors = {
  background: '#0a0a0a',
  surface: '#111827',
  surfaceSecondary: '#1f2937',
  border: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  primary: '#10b981',
  primaryDark: '#059669',
  success: '#10b981',
  danger: '#dc2626',
  warning: '#f59e0b',
  card: '#111827',
  cardBorder: '#1f2937',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark') // Default to dark

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
