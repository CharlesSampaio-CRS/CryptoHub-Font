import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native"
import { useEffect, useRef, memo } from "react"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"

interface HeaderProps {
  hideIcons?: boolean
  onNotificationsPress?: () => void
  unreadCount?: number
}

export const Header = memo(function Header({ hideIcons = false, onNotificationsPress, unreadCount = 0 }: HeaderProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const iconOpacity = useRef(new Animated.Value(1)).current
  const iconScale = useRef(new Animated.Value(1)).current
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: hideIcons ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: hideIcons ? 0.8 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [hideIcons])
  
  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>CryptoHub</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('home.subtitle')}</Text>
      </View>

      <Animated.View 
        style={[
          styles.actions,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          }
        ]}
        pointerEvents={hideIcons ? "none" : "auto"}
      >
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onNotificationsPress}
        >
          <Text style={styles.iconText}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
})

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "300",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
    borderWidth: 0.5,
    position: "relative",
  },
  iconText: {
    fontSize: 13,
    opacity: 0.5,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    includeFontPadding: false,
  },
})
