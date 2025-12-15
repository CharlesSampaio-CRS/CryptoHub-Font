import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from "react-native"
import { useState, useMemo } from "react"
import { useTheme } from "../contexts/ThemeContext"
import { Notification, mockNotifications } from "../types/notifications"

interface NotificationsModalProps {
  visible: boolean
  onClose: () => void
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  )

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Agora'
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days}d atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      case 'info': return '#3b82f6'
      default: return colors.textSecondary
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Notificações</Text>
              {unreadCount > 0 && (
                <Text style={[styles.unreadText, { color: colors.textSecondary }]}>
                  {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead}>
                  <Text style={styles.markAllButton}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Nenhuma notificação
                </Text>
                <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                  Você está em dia! Não há notificações no momento.
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    { 
                      backgroundColor: notification.read ? 'transparent' : colors.surface,
                      borderBottomColor: colors.cardBorder 
                    }
                  ]}
                  onPress={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  {/* Icon */}
                  <View style={[styles.notificationIcon, { backgroundColor: getTypeColor(notification.type) + '20' }]}>
                    <Text style={styles.notificationEmoji}>{notification.icon}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle, 
                        { color: colors.text },
                        !notification.read && styles.notificationTitleUnread
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                      {notification.message}
                    </Text>
                    <View style={styles.notificationFooter}>
                      <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNotification(notification.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  unreadText: {
    fontSize: 13,
    fontWeight: "300",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markAllButton: {
    color: "#3b82f6",
    fontSize: 13,
    fontWeight: "400",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "300",
    opacity: 0.6,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationEmoji: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "300",
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: "500",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  notificationMessage: {
    fontSize: 13,
    fontWeight: "300",
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: "300",
    opacity: 0.6,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "300",
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: "300",
    textAlign: "center",
    lineHeight: 20,
  },
})
