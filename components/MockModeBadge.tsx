import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { config } from '@/lib/config'

/**
 * Badge visual que aparece quando o app está no modo mock
 * Mostra um indicador no topo da tela informando que os dados são simulados
 */
export function MockModeBadge() {
  const { colors } = useTheme()
  const isMockMode = config.isMockMode()

  if (!isMockMode) {
    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: '#FF9500' }]}>
      <Text style={styles.icon}>🧪</Text>
      <Text style={styles.text}>MODO TESTE - Dados Simulados</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
})
