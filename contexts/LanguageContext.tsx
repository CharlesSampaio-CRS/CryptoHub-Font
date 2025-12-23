import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Language = 'pt-BR' | 'en-US'

const LANGUAGE_STORAGE_KEY = '@cryptohub:language'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  isLoading: boolean
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
    'home.performance': 'Desempenho',
    'home.exchanges': 'Minhas Corretoras',
    'home.noData': 'Sem dados disponíveis',
    'home.loading': 'Carregando dados...',
    'home.distribution': 'Por Exchange',
    'home.noExchangesConnected': 'Nenhuma exchange conectada',
    
    // Profile Screen
    'profile.title': 'Perfil',
    'profile.subtitle': 'Suas informações pessoais',
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
    'profile.termsOfUse': 'Termos de Uso',
    'profile.privacyPolicy': 'Política de Privacidade',
    'profile.edit': 'Editar',
    'profile.personalInfo': 'INFORMAÇÕES PESSOAIS',
    'profile.email': 'Email',
    'profile.phone': 'Telefone',
    'profile.actions': 'AÇÕES',
    'profile.changePassword': 'Alterar Senha',
    'profile.exportData': 'Exportar Dados',
    
    // Settings Screen
    'settings.title': 'Configurações',
    'settings.subtitle': 'Personalize seu app',
    'settings.appearance': 'Aparência',
    'settings.notificationsSection': 'Notificações',
    'settings.securitySection': 'Segurança e Privacidade',
    'settings.infoSection': 'Informações',
    'settings.securityModal': 'Segurança',
    'settings.twoFactorAuth': 'Autenticação de Dois Fatores',
    'settings.twoFactorSms': '2FA via SMS',
    'settings.twoFactorSmsDesc': 'Receba códigos de verificação por SMS',
    'settings.googleAuth': 'Google Authenticator',
    'settings.googleAuthDesc': 'Use o app Google Authenticator',
    'settings.autoLock': 'Bloqueio Automático',
    'settings.autoLockEnable': 'Ativar Bloqueio',
    'settings.autoLockDesc': 'Bloquear app após inatividade',
    'settings.inactivityTime': 'Tempo de Inatividade',
    'settings.alerts': 'Alertas',
    'settings.loginAlerts': 'Alertas de Login',
    'settings.loginAlertsDesc': 'Notificar sobre novos logins',
    'settings.activated': 'Ativado',
    'settings.deactivated': 'Desativado',
    'settings.biometricEnabled': 'ativado com sucesso',
    
    // Strategy Screen
    'strategy.title': 'Estratégias',
    'strategy.new': '+ Nova',
    'strategy.strategies': 'estratégias',
    'strategy.strategy': 'estratégia',
    'strategy.executions': 'execuções',
    'strategy.execution': 'execução',
    'strategy.empty': 'Nenhuma estratégia criada',
    'strategy.emptyDesc': 'Crie sua primeira estratégia automatizada',
    'strategy.noExecutions': 'Nenhuma execução',
    'strategy.executionsWillAppear': 'As ordens executadas aparecerão aqui',
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
    'notifications.unreadSingular': 'lida',
    'notifications.unreadPlural': 'lidas',
    'notifications.markAll': 'Marcar todas',
    'notifications.empty': 'Nenhuma notificação',
    'notifications.emptyMessage': 'Você está em dia! Não há notificações no momento.',
    'notifications.now': 'Agora',
    'notifications.minutesAgo': 'atrás',
    'notifications.hoursAgo': 'atrás',
    'notifications.yesterday': 'Ontem',
    'notifications.daysAgo': 'atrás',
    
    // Exchanges
    'exchanges.title': 'Corretoras',
    'exchanges.hideZeroTokens': 'Ocultar saldo $0',
    'exchanges.hideZeroExchanges': 'Ocultar corretoras com saldo $0',
    'exchanges.tokensAvailable': 'Tokens Disponíveis',
    'exchanges.asset': 'ativo',
    'exchanges.assets': 'ativos',
    'exchanges.error': 'Erro ao carregar corretoras',
    'exchanges.manage': 'Corretoras',
    'exchanges.connected': 'Conectadas',
    'exchanges.connectedSingular': 'conectada',
    'exchanges.connectedPlural': 'conectadas',
    'exchanges.available': 'Disponíveis',
    'exchanges.availableSingular': 'disponível',
    'exchanges.availablePlural': 'disponíveis',
    'exchanges.scanQR': 'Escanear QR Code',
    'exchanges.pasteFromClipboard': 'Colar da Área de Transferência',
    'exchanges.connect': 'Conectar',
    'exchanges.disconnect': 'Desconectar',
    'exchanges.delete': 'Deletar',
    'exchanges.viewAvailable': 'Ver Corretoras Disponíveis',
    'exchanges.connectModal': 'Conectar Corretora',
    'exchanges.addButton': '+ Adicionar',
    'exchanges.disconnectConfirm': 'Tem certeza que deseja desconectar a corretora',
    'exchanges.deleteConfirm': 'Tem certeza que deseja deletar permanentemente a corretora',
    'exchanges.deleteWarning': 'Esta ação não pode ser desfeita.',
    'exchanges.connectError': 'Não foi possível conectar a corretora',
    'exchanges.disconnectError': 'Não foi possível desconectar a corretora',
    'exchanges.deleteError': 'Não foi possível deletar a corretora',
    'exchanges.connectedAt': 'Conectada em:',
    'exchanges.status': 'Status:',
    'exchanges.activate': 'Ativar',
    'exchanges.hidden': 'ocultas',
    'exchanges.deactivate': 'Desativar',
    'exchanges.activateConfirm': 'Tem certeza que deseja ativar a corretora',
    'exchanges.deactivateConfirm': 'Tem certeza que deseja desativar a corretora',
    'exchanges.activateWarning': 'Ela ficará disponível para uso nas estratégias.',
    'exchanges.deactivateWarning': 'Ela não será mais utilizada pelas estratégias.',
    
    // Token Details
    'token.details': 'Detalhes do Token',
    'token.currentPrice': 'Preço Atual',
    'token.priceVariation': 'Variação de Preço',
    'token.high24h': 'Máxima 24h',
    'token.low24h': 'Mínima 24h',
    'token.volume24h': 'Volume 24h',
    'token.marketInfo': 'Informações de Mercado',
    'token.limits': 'Limites',
    'token.minAmount': 'Qtd. Mínima',
    'token.maxAmount': 'Qtd. Máxima',
    'token.minCost': 'Custo Mín.',
    'token.maxCost': 'Custo Máx.',
    'token.precision': 'Precisão',
    'token.amountPrecision': 'Qtd.',
    'token.pricePrecision': 'Preço',
    'token.bidPrice': 'Preço de Compra',
    'token.askPrice': 'Preço de Venda',
    'token.spread': 'Spread',
    'token.lastUpdate': 'Última atualização',
    'token.pair': 'Par',
    'token.noData': 'Dados não disponíveis',
    
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
    'common.warning': 'Aviso',
    'common.attention': 'Atenção',
    'common.ok': 'OK',
    
    // Error Messages
    'error.cameraAccess': 'Não foi possível acessar a câmera',
    'error.loadExchanges': 'Não foi possível carregar suas exchanges',
    'error.loadTokens': 'Não foi possível carregar os tokens',
    'error.createStrategy': 'Não foi possível criar a estratégia',
    'error.connectExchange': 'Não foi possível conectar a exchange',
    'error.updateExchangeStatus': 'Não foi possível atualizar o status da exchange',
    'error.disconnectExchange': 'Não foi possível desconectar a exchange',
    'error.deleteExchange': 'Não foi possível deletar a exchange',
    'error.pasteClipboard': 'Não foi possível colar da área de transferência',
    'error.fillAllFields': 'Por favor, preencha todos os campos',
    'error.fillApiKeys': 'Por favor, preencha API Key e API Secret',
    'error.passphraseRequired': 'Esta exchange requer uma Passphrase',
    'error.loginFailed': 'Falha ao fazer login',
    'error.biometricFailed': 'Falha na autenticação biométrica',
    'error.unknownError': 'Erro desconhecido',
    'error.invalidResponse': 'Formato de resposta inválido',
    
    // Success Messages
    'success.strategyCreated': 'Estratégia criada com sucesso!',
    'success.pastedClipboard': 'Colado!',
    'success.textPasted': 'Texto colado da área de transferência',
    
    // Warning Messages
    'warning.noTokensAvailable': 'Esta exchange não possui tokens disponíveis',
    'warning.emptyClipboard': 'Área vazia',
    'warning.noClipboardText': 'Não há texto na área de transferência',
    
    // Exchange Alerts
    'alert.exchangeInactive': 'Exchange Inativa',
    
    // Loading Progress
    'loading.title': 'Preparando tudo para você',
    'loading.authenticating': 'Autenticando usuário',
    'loading.fetchingExchanges': 'Buscando corretoras conectadas',
    'loading.loadingBalances': 'Carregando saldos',
    'loading.calculatingPortfolio': 'Calculando portfólio',
    'loading.almostReady': 'Quase pronto!',
    
    // Maintenance Screen
    'maintenance.title': 'Estamos em Manutenção',
    'maintenance.message': 'Nossos servidores estão temporariamente indisponíveis. Estamos trabalhando para restaurar o serviço o mais rápido possível.',
    'maintenance.subMessage': 'Pedimos desculpas pelo inconveniente. Tente novamente em alguns instantes.',
    'maintenance.retry': 'Tentar Novamente',
    'maintenance.contact': 'Se o problema persistir, entre em contato com o suporte.',
    
    // Login Screen
    'login.welcome': 'Bem vindo!',
    'login.subtitle': 'Acesse sua conta para continuar',
    'login.email': 'Email',
    'login.emailPlaceholder': 'seu@email.com',
    'login.password': 'Senha',
    'login.passwordPlaceholder': '••••••••',
    'login.showPassword': 'Mostrar',
    'login.hidePassword': 'Ocultar',
    'login.forgotPassword': 'Esqueceu a senha?',
    'login.signIn': 'Entrar',
    'login.orContinueWith': 'ou continue com',
    'login.or': 'ou',
    'login.signInWith': 'Entrar com',
    'login.google': 'Google',
    'login.apple': 'Apple',
    'login.noAccount': 'Não tem uma conta?',
    'login.signUp': 'Cadastre-se',
    'login.googleError': 'Falha ao fazer login com Google',
    'login.appleError': 'Falha ao fazer login com Apple',
    
    // SignUp Screen
    'signup.fillAllFields': 'Por favor, preencha todos os campos',
    'signup.passwordMismatch': 'As senhas não coincidem',
    'signup.passwordTooShort': 'A senha deve ter pelo menos 6 caracteres',
    'signup.accountCreated': 'Conta criada com sucesso!',
    'signup.createAccountFailed': 'Falha ao criar conta',
    'signup.googleSignupFailed': 'Falha ao cadastrar com Google',
    'signup.appleSignupFailed': 'Falha ao cadastrar com Apple',
    'signup.title': 'Criar Conta',
    'signup.subtitle': 'Comece sua jornada hoje',
    'signup.nameLabel': 'Nome completo',
    'signup.namePlaceholder': 'João Silva',
    'signup.emailLabel': 'Email',
    'signup.emailPlaceholder': 'seu@email.com',
    'signup.passwordLabel': 'Senha',
    'signup.passwordPlaceholder': 'Mínimo 6 caracteres',
    'signup.confirmPasswordLabel': 'Confirmar senha',
    'signup.confirmPasswordPlaceholder': 'Digite a senha novamente',
    'signup.showPassword': 'Mostrar',
    'signup.hidePassword': 'Ocultar',
    'signup.termsText': 'Ao criar uma conta, você concorda com nossos',
    'signup.termsOfService': 'Termos de Serviço',
    'signup.and': 'e',
    'signup.privacyPolicy': 'Política de Privacidade',
    'signup.createButton': 'Criar Conta',
    'signup.orSignUpWith': 'ou cadastre-se com',
    'signup.google': 'Google',
    'signup.apple': 'Apple',
    'signup.alreadyHaveAccount': 'Já tem uma conta?',
    'signup.signIn': 'Entrar',
    
    // Portfolio & Home Additional
    'portfolio.basedOnBalance': 'Patrimônio baseado no saldo das corretoras',
    'portfolio.updatedAt': 'Atualizado em',
    'portfolio.variationsNote': 'As variações são consultadas nas corretoras',
    'portfolio.lastDays': 'Últimos {days} dias',
    
    // Settings Additional
    'settings.securityPrivacySection': 'Segurança e Privacidade',
    'settings.infoSectionTitle': 'Informações',
    'settings.accountSection': 'Conta',
    'settings.deleteAccount': 'Excluir Conta',
    'settings.biometricDisabled': 'desativado com sucesso',
    // Removed duplicate 'settings.biometricEnabled'
    'settings.biometricError': 'Falha ao configurar biometria',
    'settings.deleteAccountTitle': '⚠️ Confirmar Exclusão',
    'settings.deleteAccountWarning': 'ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTem certeza absoluta que deseja excluir sua conta?',
    'settings.deleteAccountConfirm': 'ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nDigite "EXCLUIR" para confirmar a exclusão da conta:',
    'settings.deleteAccountSuccess': 'Conta excluída com sucesso',
    'settings.deleteAccountButton': 'Excluir',
    'settings.cancel': 'Cancelar',
    
    // Profile
    'profile.logoutError': 'Não foi possível realizar o logout',
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
    'home.performance': 'Performance',
    'home.exchanges': 'My Exchanges',
    'home.noData': 'No data available',
    'home.loading': 'Loading data...',
    'home.distribution': 'By Exchange',
    'home.noExchangesConnected': 'No exchanges connected',
    
    // Profile Screen
    'profile.title': 'Profile',
    'profile.subtitle': 'Your personal information',
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
    'profile.termsOfUse': 'Terms of Use',
    'profile.privacyPolicy': 'Privacy Policy',
    'profile.edit': 'Edit',
    'profile.personalInfo': 'PERSONAL INFORMATION',
    'profile.email': 'Email',
    'profile.phone': 'Phone',
    'profile.actions': 'ACTIONS',
    'profile.changePassword': 'Change Password',
    'profile.exportData': 'Export Data',
    
    // Settings Screen
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your app',
    'settings.appearance': 'Appearance',
    'settings.notificationsSection': 'Notifications',
    'settings.securitySection': 'Security & Privacy',
    'settings.infoSection': 'Information',
    'settings.securityModal': 'Security',
    'settings.twoFactorAuth': 'Two-Factor Authentication',
    'settings.twoFactorSms': '2FA via SMS',
    'settings.twoFactorSmsDesc': 'Receive verification codes via SMS',
    'settings.googleAuth': 'Google Authenticator',
    'settings.googleAuthDesc': 'Use the Google Authenticator app',
    'settings.autoLock': 'Auto Lock',
    'settings.autoLockEnable': 'Enable Lock',
    'settings.autoLockDesc': 'Lock app after inactivity',
    'settings.inactivityTime': 'Inactivity Time',
    'settings.alerts': 'Alerts',
    'settings.loginAlerts': 'Login Alerts',
    'settings.loginAlertsDesc': 'Notify about new logins',
    'settings.activated': 'Enabled',
    'settings.deactivated': 'Disabled',
    'settings.biometricEnabled': 'enabled successfully',
    'settings.biometricDisabled': 'disabled successfully',
    'settings.biometricError': 'Failed to configure biometrics',
    
    // Strategy Screen
    'strategy.title': 'Strategies',
    'strategy.new': '+ New',
    'strategy.strategies': 'strategies',
    'strategy.strategy': 'strategy',
    'strategy.executions': 'executions',
    'strategy.execution': 'execution',
    'strategy.empty': 'No strategies created',
    'strategy.emptyDesc': 'Create your first automated strategy',
    'strategy.noExecutions': 'No executions',
    'strategy.executionsWillAppear': 'Executed orders will appear here',
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
    'notifications.unreadSingular': 'read',
    'notifications.unreadPlural': 'read',
    'notifications.markAll': 'Mark all',
    'notifications.empty': 'No notifications',
    'notifications.emptyMessage': 'You\'re all caught up! No notifications at this time.',
    'notifications.now': 'Now',
    'notifications.minutesAgo': 'ago',
    'notifications.hoursAgo': 'ago',
    'notifications.yesterday': 'Yesterday',
    'notifications.daysAgo': 'ago',
    
    // Exchanges
    'exchanges.title': 'Exchanges',
    'exchanges.hideZero': 'Hide exchanges with $0 balance',
    'exchanges.hideZeroTokens': 'Hide tokens with $0 balance',
    'exchanges.hideZeroExchanges': 'Hide exchanges with $0 balance',
    'exchanges.tokensAvailable': 'Available Tokens',
    'exchanges.asset': 'asset',
    'exchanges.assets': 'assets',
    'exchanges.error': 'Error loading exchanges',
    'exchanges.manage': 'Exchanges',
    'exchanges.connected': 'Connected',
    'exchanges.connectedSingular': 'connected',
    'exchanges.connectedPlural': 'connected',
    'exchanges.available': 'Available',
    'exchanges.availableSingular': 'available',
    'exchanges.availablePlural': 'available',
    'exchanges.scanQR': 'Scan QR Code',
    'exchanges.pasteFromClipboard': 'Paste from Clipboard',
    'exchanges.connect': 'Connect',
    'exchanges.disconnect': 'Disconnect',
    'exchanges.delete': 'Delete',
    'exchanges.viewAvailable': 'View Available Exchanges',
    'exchanges.connectModal': 'Connect Exchange',
    'exchanges.addButton': '+ Add',
    'exchanges.disconnectConfirm': 'Are you sure you want to disconnect the exchange',
    'exchanges.deleteConfirm': 'Are you sure you want to permanently delete the exchange',
    'exchanges.deleteWarning': 'This action cannot be undone.',
    'exchanges.connectError': 'Could not connect the exchange',
    'exchanges.disconnectError': 'Could not disconnect the exchange',
    'exchanges.deleteError': 'Could not delete the exchange',
    'exchanges.connectedAt': 'Connected at:',
    'exchanges.status': 'Status:',
    'exchanges.activate': 'Activate',
    'exchanges.hidden': 'hidden',
    'exchanges.deactivate': 'Deactivate',
    'exchanges.activateConfirm': 'Are you sure you want to activate the exchange',
    'exchanges.deactivateConfirm': 'Are you sure you want to deactivate the exchange',
    'exchanges.activateWarning': 'It will be available for use in strategies.',
    'exchanges.deactivateWarning': 'It will no longer be used by strategies.',
    
    // Token Details
    'token.details': 'Token Details',
    'token.currentPrice': 'Current Price',
    'token.priceVariation': 'Price Variation',
    'token.high24h': '24h High',
    'token.low24h': '24h Low',
    'token.volume24h': '24h Volume',
    'token.marketInfo': 'Market Information',
    'token.limits': 'Limits',
    'token.minAmount': 'Min Amount',
    'token.maxAmount': 'Max Amount',
    'token.minCost': 'Min Cost',
    'token.maxCost': 'Max Cost',
    'token.precision': 'Precision',
    'token.amountPrecision': 'Amount',
    'token.pricePrecision': 'Price',
    'token.bidPrice': 'Bid Price',
    'token.askPrice': 'Ask Price',
    'token.spread': 'Spread',
    'token.lastUpdate': 'Last update',
    'token.pair': 'Pair',
    'token.noData': 'Data not available',
    
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
    'common.warning': 'Warning',
    'common.attention': 'Attention',
    'common.ok': 'OK',
    
    // Error Messages
    'error.cameraAccess': 'Could not access the camera',
    'error.loadExchanges': 'Could not load your exchanges',
    'error.loadTokens': 'Could not load tokens',
    'error.createStrategy': 'Could not create strategy',
    'error.connectExchange': 'Could not connect exchange',
    'error.updateExchangeStatus': 'Could not update exchange status',
    'error.disconnectExchange': 'Could not disconnect exchange',
    'error.deleteExchange': 'Could not delete exchange',
    'error.pasteClipboard': 'Could not paste from clipboard',
    'error.fillAllFields': 'Please fill all fields',
    'error.fillApiKeys': 'Please fill API Key and API Secret',
    'error.passphraseRequired': 'This exchange requires a Passphrase',
    'error.loginFailed': 'Login failed',
    'error.biometricFailed': 'Biometric authentication failed',
    'error.unknownError': 'Unknown error',
    'error.invalidResponse': 'Invalid response format',
    
    // Success Messages
    'success.strategyCreated': 'Strategy created successfully!',
    'success.pastedClipboard': 'Pasted!',
    'success.textPasted': 'Text pasted from clipboard',
    
    // Warning Messages
    'warning.noTokensAvailable': 'This exchange has no tokens available',
    'warning.emptyClipboard': 'Empty clipboard',
    'warning.noClipboardText': 'No text in clipboard',
    
    // Exchange Alerts
    'alert.exchangeInactive': 'Inactive Exchange',
    
    // Loading Progress
    'loading.title': 'Getting everything ready',
    'loading.authenticating': 'Authenticating user',
    'loading.fetchingExchanges': 'Fetching connected exchanges',
    'loading.loadingBalances': 'Loading balances',
    'loading.calculatingPortfolio': 'Calculating portfolio',
    'loading.almostReady': 'Almost ready!',
    
    // Maintenance Screen
    'maintenance.title': 'Under Maintenance',
    'maintenance.message': 'Our servers are temporarily unavailable. We are working to restore service as quickly as possible.',
    'maintenance.subMessage': 'We apologize for the inconvenience. Please try again in a few moments.',
    'maintenance.retry': 'Try Again',
    'maintenance.contact': 'If the problem persists, please contact support.',
    
    // Login Screen
    'login.welcome': 'Welcome!',
    'login.subtitle': 'Sign in to your account to continue',
    'login.email': 'Email',
    'login.emailPlaceholder': 'your@email.com',
    'login.password': 'Password',
    'login.passwordPlaceholder': '••••••••',
    'login.showPassword': 'Show',
    'login.hidePassword': 'Hide',
    'login.forgotPassword': 'Forgot password?',
    'login.signIn': 'Sign In',
    'login.orContinueWith': 'or continue with',
    'login.or': 'or',
    'login.signInWith': 'Sign in with',
    'login.google': 'Google',
    'login.apple': 'Apple',
    'login.noAccount': 'Don\'t have an account?',
    'login.signUp': 'Sign Up',
    'login.googleError': 'Failed to sign in with Google',
    'login.appleError': 'Failed to sign in with Apple',
    
    // SignUp Screen
    'signup.fillAllFields': 'Please fill in all fields',
    'signup.passwordMismatch': 'Passwords do not match',
    'signup.passwordTooShort': 'Password must be at least 6 characters',
    'signup.accountCreated': 'Account created successfully!',
    'signup.createAccountFailed': 'Failed to create account',
    'signup.googleSignupFailed': 'Failed to sign up with Google',
    'signup.appleSignupFailed': 'Failed to sign up with Apple',
    'signup.title': 'Create Account',
    'signup.subtitle': 'Start your journey today',
    'signup.nameLabel': 'Full name',
    'signup.namePlaceholder': 'John Doe',
    'signup.emailLabel': 'Email',
    'signup.emailPlaceholder': 'your@email.com',
    'signup.passwordLabel': 'Password',
    'signup.passwordPlaceholder': 'Minimum 6 characters',
    'signup.confirmPasswordLabel': 'Confirm password',
    'signup.confirmPasswordPlaceholder': 'Enter password again',
    'signup.showPassword': 'Show',
    'signup.hidePassword': 'Hide',
    'signup.termsText': 'By creating an account, you agree to our',
    'signup.termsOfService': 'Terms of Service',
    'signup.and': 'and',
    'signup.privacyPolicy': 'Privacy Policy',
    'signup.createButton': 'Create Account',
    'signup.orSignUpWith': 'or sign up with',
    'signup.google': 'Google',
    'signup.apple': 'Apple',
    'signup.alreadyHaveAccount': 'Already have an account?',
    'signup.signIn': 'Sign In',
    
    // Portfolio & Home Additional
    'portfolio.basedOnBalance': 'Portfolio based on exchange balances',
    'portfolio.updatedAt': 'Updated at',
    'portfolio.variationsNote': 'Variations are retrieved from exchanges',
    'portfolio.lastDays': 'Last {days} days',
    
    // Settings Additional
    'settings.securityPrivacySection': 'Security Privacy',
    'settings.infoSectionTitle': 'Information',
    'settings.accountSection': 'Account',
    'settings.deleteAccount': 'Delete Account',
    'settings.deleteAccountTitle': '⚠️ Confirm Deletion',
    'settings.deleteAccountWarning': 'WARNING: This action is IRREVERSIBLE!\n\nAre you absolutely sure you want to delete your account?',
    'settings.deleteAccountConfirm': 'WARNING: This action is IRREVERSIBLE!\n\nType "DELETE" to confirm account deletion:',
    'settings.deleteAccountSuccess': 'Account deleted successfully',
    'settings.deleteAccountButton': 'Delete',
    'settings.cancel': 'Cancel',
    
    // Profile
    'profile.logoutError': 'Could not complete logout',
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt-BR')
  const [isLoading, setIsLoading] = useState(true)

  // Load language from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
        if (savedLanguage === 'pt-BR' || savedLanguage === 'en-US') {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error('Error loading language:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguage()
  }, [])

  // Save language to storage whenever it changes
  const handleSetLanguage = useCallback(async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage)
      setLanguage(newLanguage)
    } catch (error) {
      console.error('Error saving language:', error)
      // Still update the state even if storage fails
      setLanguage(newLanguage)
    }
  }, [])

  // Translation function
  const t = useCallback((key: string): string => {
    return translations[language][key as keyof typeof translations['pt-BR']] || key
  }, [language])

  // Memoize context value
  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t,
    isLoading
  }), [language, handleSetLanguage, t, isLoading])

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
