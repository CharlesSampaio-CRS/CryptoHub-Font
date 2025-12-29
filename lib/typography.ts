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
  h1: 32,      // Título principal de página (+8)
  h2: 28,      // Título de seção grande (+8)
  h3: 24,      // Título de seção média (+6)
  h4: 20,      // Subtítulo/Card title (+4)
  
  // ========================================
  // CORPO DE TEXTO (Body)
  // ========================================
  body: 18,         // Texto principal padrão (+4)
  bodyLarge: 19,    // Texto destacado/importante (+4)
  bodySmall: 17,    // Texto secundário (+4)
  
  // ========================================
  // TEXTOS PEQUENOS (Small text)
  // ========================================
  caption: 16,  // Labels, descrições, helper text (+4)
  tiny: 15,     // Metadados, timestamps, contadores (+4)
  micro: 14,    // Badges, tags, variações de preço (+4)
  
  // ========================================
  // VALORES NUMÉRICOS (Display)
  // ========================================
  displayLarge: 54,   // Valor principal do portfolio (+12)
  display: 36,        // Valores grandes (gráficos) (+8)
  displaySmall: 28,   // Valores médios (+8)
  
  // ========================================
  // BOTÕES (Buttons)
  // ========================================
  button: 19,       // Botão primário/principal (+4)
  buttonSmall: 17,  // Botão secundário/pequeno (+4)
  
  // ========================================
  // FORMULÁRIOS (Forms)
  // ========================================
  input: 20,        // Texto de input (+4)
  label: 16,        // Labels de formulário (+4)
  placeholder: 19,  // Placeholder text (+3)
  errorText: 15,    // Mensagens de erro (+3)
  
  // ========================================
  // ÍCONES E EMOJIS (Icons)
  // ========================================
  iconSmall: 18,    // Ícones pequenos (+2)
  icon: 22,         // Ícones médios (+2)
  iconLarge: 26,    // Ícones grandes (+2)
  emoji: 36,        // Emojis decorativos (+4)
  emojiLarge: 52,   // Emojis de destaque (+4)
  emojiHuge: 68,    // Emojis de empty state (+4)
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
