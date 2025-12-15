import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'

type Language = 'pt-BR' | 'en-US'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const translations = {
  'pt-BR': {
    // Navigation
    'nav.home': 'Início',
    'nav.exchanges': 'Exchanges',
    'nav.strategies': 'Estratégias',
    'nav.profile': 'Perfil',
    
    // Home Screen
    'home.title': 'CryptoHub',
    'home.subtitle': 'Seus investimentos unificados',
    'home.portfolio': 'Patrimônio Total',
    'home.last24h': 'últimas 24h',
    'home.performance': 'Desempenho - 7 dias',
    'home.exchanges': 'Minhas Exchanges',
    
    // Profile Screen
    'profile.title': 'Perfil',
    'profile.subtitle': 'Configurações da conta',
    'profile.user': 'Usuário do CryptoHub',
    'profile.settings': 'Configurações',
    'profile.notifications': 'Notificações',
    'profile.security': 'Segurança',
    'profile.language': 'Idioma',
    'profile.currency': 'Moeda Preferida',
    'profile.appearance': 'Aparência',
    'profile.darkMode': 'Modo Escuro',
    'profile.enabled': 'Ativado',
    'profile.disabled': 'Desativado',
    'profile.about': 'Sobre',
    'profile.aboutApp': 'Sobre o App',
    'profile.terms': 'Termos de Uso',
    'profile.privacy': 'Privacidade',
    'profile.logout': 'Sair da Conta',
    'profile.version': 'Versão',
    
    // Strategy Screen
    'strategy.title': 'Estratégias',
    'strategy.new': '+ Nova',
    'strategy.strategies': 'estratégias',
    'strategy.strategy': 'estratégia',
    'strategy.executions': 'execuções',
    'strategy.execution': 'execução',
    'strategy.empty': 'Nenhuma estratégia criada',
    'strategy.emptyDesc': 'Crie sua primeira estratégia automatizada',
    'strategy.active': 'Ativa',
    'strategy.inactive': 'Inativa',
    'strategy.delete': 'Deletar',
    
    // Common
    'common.close': 'Fechar',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.continue': 'Continuar',
    'common.confirm': 'Confirmar',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.refresh': 'Atualizar',
  },
  'en-US': {
    // Navigation
    'nav.home': 'Home',
    'nav.exchanges': 'Exchanges',
    'nav.strategies': 'Strategies',
    'nav.profile': 'Profile',
    
    // Home Screen
    'home.title': 'CryptoHub',
    'home.subtitle': 'Your unified investments',
    'home.portfolio': 'Total Portfolio',
    'home.last24h': 'last 24h',
    'home.performance': 'Performance - 7 days',
    'home.exchanges': 'My Exchanges',
    
    // Profile Screen
    'profile.title': 'Profile',
    'profile.subtitle': 'Account settings',
    'profile.user': 'CryptoHub User',
    'profile.settings': 'Settings',
    'profile.notifications': 'Notifications',
    'profile.security': 'Security',
    'profile.language': 'Language',
    'profile.currency': 'Preferred Currency',
    'profile.appearance': 'Appearance',
    'profile.darkMode': 'Dark Mode',
    'profile.enabled': 'Enabled',
    'profile.disabled': 'Disabled',
    'profile.about': 'About',
    'profile.aboutApp': 'About the App',
    'profile.terms': 'Terms of Use',
    'profile.privacy': 'Privacy',
    'profile.logout': 'Sign Out',
    'profile.version': 'Version',
    
    // Strategy Screen
    'strategy.title': 'Strategies',
    'strategy.new': '+ New',
    'strategy.strategies': 'strategies',
    'strategy.strategy': 'strategy',
    'strategy.executions': 'executions',
    'strategy.execution': 'execution',
    'strategy.empty': 'No strategies created',
    'strategy.emptyDesc': 'Create your first automated strategy',
    'strategy.active': 'Active',
    'strategy.inactive': 'Inactive',
    'strategy.delete': 'Delete',
    
    // Common
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.continue': 'Continue',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.refresh': 'Refresh',
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt-BR')

  // Translation function
  const t = useCallback((key: string): string => {
    return translations[language][key as keyof typeof translations['pt-BR']] || key
  }, [language])

  // Memoize context value
  const value = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
