/**
 * Typography System - CryptoHub
 * 
 * Sistema centralizado de tamanhos de fonte para garantir consistência
 * visual em toda a aplicação.
 * 
 * @see docs/TYPOGRAPHY_STANDARD.md para documentação completa
 */

export const typography = {
  // ========================================
  // TÍTULOS (Headings)
  // ========================================
  h1: 28,      // Título principal de página (+4)
  h2: 24,      // Título de seção grande (+4)
  h3: 20,      // Título de seção média (+2)
  h4: 18,      // Subtítulo/Card title (+2)
  
  // ========================================
  // CORPO DE TEXTO (Body)
  // ========================================
  body: 16,         // Texto principal padrão (+2)
  bodyLarge: 17,    // Texto destacado/importante (+2)
  bodySmall: 15,    // Texto secundário (+2)
  
  // ========================================
  // TEXTOS PEQUENOS (Small text)
  // ========================================
  caption: 14,  // Labels, descrições, helper text (+2)
  tiny: 13,     // Metadados, timestamps, contadores (+2)
  micro: 12,    // Badges, tags, variações de preço (+2)
  
  // ========================================
  // VALORES NUMÉRICOS (Display)
  // ========================================
  displayLarge: 48,   // Valor principal do portfolio (+6)
  display: 32,        // Valores grandes (gráficos) (+4)
  displaySmall: 24,   // Valores médios (+4)
  
  // ========================================
  // BOTÕES (Buttons)
  // ========================================
  button: 17,       // Botão primário/principal (+2)
  buttonSmall: 15,  // Botão secundário/pequeno (+2)
  
  // ========================================
  // FORMULÁRIOS (Forms)
  // ========================================
  input: 18,        // Texto de input (+2)
  label: 14,        // Labels de formulário (+2)
  placeholder: 17,  // Placeholder text (+1)
  errorText: 13,    // Mensagens de erro (+1)
  
  // ========================================
  // ÍCONES E EMOJIS (Icons)
  // ========================================
  iconSmall: 16,    // Ícones pequenos
  icon: 20,         // Ícones médios
  iconLarge: 24,    // Ícones grandes
  emoji: 32,        // Emojis decorativos
  emojiLarge: 48,   // Emojis de destaque
  emojiHuge: 64,    // Emojis de empty state
} as const

/**
 * Font weights padronizados
 * Use strings para compatibilidade cross-platform
 */
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

/**
 * Letter spacing para casos específicos
 */
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const

/**
 * Line heights recomendados
 */
export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const

// Export type para TypeScript
export type Typography = typeof typography
export type FontWeight = typeof fontWeights[keyof typeof fontWeights]
export type LetterSpacing = typeof letterSpacing[keyof typeof letterSpacing]
export type LineHeight = typeof lineHeights[keyof typeof lineHeights]
