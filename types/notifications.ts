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
