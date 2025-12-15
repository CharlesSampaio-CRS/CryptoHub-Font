export type NotificationType = 'success' | 'warning' | 'info' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  icon?: string
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Ordem Executada',
    message: 'Sua ordem de compra de BTC foi executada com sucesso na Binance.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
    read: false,
    icon: '✅'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Preço Alvo Atingido',
    message: 'ETH atingiu seu preço alvo de $2,500. Considere revisar sua estratégia.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    read: false,
    icon: '⚠️'
  },
  {
    id: '3',
    type: 'info',
    title: 'Nova Estratégia Criada',
    message: 'Estratégia "DCA Bitcoin" foi criada e está ativa.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    read: true,
    icon: 'ℹ️'
  },
  {
    id: '4',
    type: 'success',
    title: 'Conexão Estabelecida',
    message: 'Exchange Coinbase conectada com sucesso.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 horas atrás
    read: true,
    icon: '🔗'
  },
  {
    id: '5',
    type: 'error',
    title: 'Erro na API',
    message: 'Falha ao conectar com Kraken. Verifique suas credenciais.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    read: true,
    icon: '❌'
  },
  {
    id: '6',
    type: 'info',
    title: 'Atualização Disponível',
    message: 'Nova versão do CryptoHub está disponível. Atualize para v2.1.0.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 dias atrás
    read: true,
    icon: '🔄'
  },
  {
    id: '7',
    type: 'warning',
    title: 'Saldo Baixo',
    message: 'Seu saldo em USDT na Binance está abaixo de $100.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 dias atrás
    read: true,
    icon: '💰'
  }
]
