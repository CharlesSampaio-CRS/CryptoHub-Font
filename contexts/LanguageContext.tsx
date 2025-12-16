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
    'nav.exchanges': 'Corretoras',
    'nav.strategies': 'Estratégias',
    'nav.profile': 'Perfil',
    
    // Home Screen
    'home.title': 'CryptoHub',
    'home.subtitle': 'Seus investimentos unificados',
    'home.portfolio': 'Patrimônio Total',
    'home.last24h': 'últimas 24h',
    'home.performance': 'Desempenho - 7 dias',
    'home.exchanges': 'Minhas Corretoras',
    'home.noData': 'Sem dados disponíveis',
    'home.loading': 'Carregando dados...',
    
    // Profile Screen
    'profile.title': 'Perfil',
    'profile.subtitle': 'Configurações da conta',
    'profile.user': 'Usuário do CryptoHub',
    'profile.settings': 'Configurações',
    'profile.notifications': 'Notificações',
    'profile.security': 'Segurança',
    'profile.language': 'Idioma',
    'profile.languagePt': 'Português (BR)',
    'profile.languageEn': 'English (US)',
    'profile.currency': 'Moeda Preferida',
    'profile.appearance': 'Aparência',
    'profile.darkMode': 'Modo Escuro',
    'profile.enabled': 'Ativado',
    'profile.disabled': 'Desativado',
    'profile.about': 'Sobre',
    'profile.aboutApp': 'Sobre o App',
    'profile.terms': 'Termos de Uso',
    'profile.privacy': 'Privacidade',
    'profile.logout': 'Sair',
    'profile.logoutConfirm': 'Tem certeza que deseja sair?',
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
    'strategy.confirmDelete': 'Tem certeza que deseja deletar esta estratégia?',
    'strategy.deleteWarning': 'Esta ação não pode ser desfeita.',
    'strategy.activateConfirm': 'Deseja ativar esta estratégia?',
    'strategy.deactivateConfirm': 'Deseja desativar esta estratégia?',
    'strategy.statusWillChange': 'O status da estratégia será alterado.',
    'strategy.simple': 'Simples',
    'strategy.simpleDesc': 'Estratégia básica (1 TP 5%, SL 2%)',
    'strategy.conservative': 'Conservadora',
    'strategy.conservativeDesc': 'Proteção máxima (2 TPs, trailing stop)',
    'strategy.aggressive': 'Agressiva',
    'strategy.aggressiveDesc': 'Máximo lucro (3 TPs, DCA ativo)',
    
    // Notifications
    'notifications.title': 'Notificações',
    'notifications.unread': 'não lidas',
    'notifications.markAll': 'Marcar todas',
    'notifications.empty': 'Nenhuma notificação',
    'notifications.emptyMessage': 'Você está em dia! Não há notificações no momento.',
    
    // Exchanges
    'exchanges.title': 'Corretoras',
    'exchanges.hideZeroTokens': 'Ocultar saldo $0',
    'exchanges.error': 'Erro ao carregar corretoras',
    'exchanges.manage': 'Corretoras',
    'exchanges.connected': 'Conectadas',
    'exchanges.available': 'Disponíveis',
    'exchanges.connect': 'Conectar',
    'exchanges.disconnect': 'Desconectar',
    'exchanges.delete': 'Deletar',
    'exchanges.viewAvailable': 'Ver Corretoras Disponíveis',
    'exchanges.connectModal': 'Conectar Corretora',
    'exchanges.disconnectConfirm': 'Tem certeza que deseja desconectar a corretora',
    'exchanges.deleteConfirm': 'Tem certeza que deseja deletar permanentemente a corretora',
    'exchanges.deleteWarning': 'Esta ação não pode ser desfeita.',
    'exchanges.connectError': 'Não foi possível conectar a corretora',
    'exchanges.disconnectError': 'Não foi possível desconectar a corretora',
    'exchanges.deleteError': 'Não foi possível deletar a corretora',
    'exchanges.connectedAt': 'Conectada em:',
    'exchanges.status': 'Status:',
    'exchanges.activate': 'Ativar',
    'exchanges.deactivate': 'Desativar',
    'exchanges.activateConfirm': 'Tem certeza que deseja ativar a corretora',
    'exchanges.deactivateConfirm': 'Tem certeza que deseja desativar a corretora',
    'exchanges.activateWarning': 'Ela ficará disponível para uso nas estratégias.',
    'exchanges.deactivateWarning': 'Ela não será mais utilizada pelas estratégias.',
    
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
    'common.yes': 'Sim',
    'common.no': 'Não',
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
    'home.noData': 'No data available',
    'home.loading': 'Loading data...',
    
    // Profile Screen
    'profile.title': 'Profile',
    'profile.subtitle': 'Account settings',
    'profile.user': 'CryptoHub User',
    'profile.settings': 'Settings',
    'profile.notifications': 'Notifications',
    'profile.security': 'Security',
    'profile.language': 'Language',
    'profile.languagePt': 'Português (BR)',
    'profile.languageEn': 'English (US)',
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
    'profile.logoutConfirm': 'Are you sure you want to logout?',
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
    'strategy.confirmDelete': 'Are you sure you want to delete this strategy?',
    'strategy.deleteWarning': 'This action cannot be undone.',
    'strategy.activateConfirm': 'Do you want to activate this strategy?',
    'strategy.deactivateConfirm': 'Do you want to deactivate this strategy?',
    'strategy.statusWillChange': 'The strategy status will be changed.',
    'strategy.simple': 'Simple',
    'strategy.simpleDesc': 'Basic strategy (1 TP 5%, SL 2%)',
    'strategy.conservative': 'Conservative',
    'strategy.conservativeDesc': 'Maximum protection (2 TPs, trailing stop)',
    'strategy.aggressive': 'Aggressive',
    'strategy.aggressiveDesc': 'Maximum profit (3 TPs, active DCA)',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.unread': 'unread',
    'notifications.markAll': 'Mark all',
    'notifications.empty': 'No notifications',
    'notifications.emptyMessage': 'You\'re all caught up! No notifications at this time.',
    
    // Exchanges
    'exchanges.title': 'Exchanges',
    'exchanges.hideZero': 'Hide exchanges with $0 balance',
    'exchanges.hideZeroTokens': 'Hide tokens with $0 balance',
    'exchanges.error': 'Error loading exchanges',
    'exchanges.manage': 'Exchanges',
    'exchanges.connected': 'Connected',
    'exchanges.available': 'Available',
    'exchanges.connect': 'Connect',
    'exchanges.disconnect': 'Disconnect',
    'exchanges.delete': 'Delete',
    'exchanges.viewAvailable': 'View Available Exchanges',
    'exchanges.connectModal': 'Connect Exchange',
    'exchanges.disconnectConfirm': 'Are you sure you want to disconnect the exchange',
    'exchanges.deleteConfirm': 'Are you sure you want to permanently delete the exchange',
    'exchanges.deleteWarning': 'This action cannot be undone.',
    'exchanges.connectError': 'Could not connect the exchange',
    'exchanges.disconnectError': 'Could not disconnect the exchange',
    'exchanges.deleteError': 'Could not delete the exchange',
    'exchanges.connectedAt': 'Connected at:',
    'exchanges.status': 'Status:',
    'exchanges.activate': 'Activate',
    'exchanges.deactivate': 'Deactivate',
    'exchanges.activateConfirm': 'Are you sure you want to activate the exchange',
    'exchanges.deactivateConfirm': 'Are you sure you want to deactivate the exchange',
    'exchanges.activateWarning': 'It will be available for use in strategies.',
    'exchanges.deactivateWarning': 'It will no longer be used by strategies.',
    
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
    'common.yes': 'Yes',
    'common.no': 'No',
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
