import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native"
import { useEffect, useRef, memo } from "react"
import Svg, { Path, Circle } from "react-native-svg"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { usePrivacy } from "../contexts/PrivacyContext"

// Eye Icon (valores visíveis)
const EyeIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
  </Svg>
)

// Eye Off Icon (valores ocultos)
const EyeOffIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3l18 18M10.5 10.677a2.5 2.5 0 0 0 3.323 3.323"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.362 7.561C5.68 8.74 4.279 10.42 3 12.5c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.85M12 5c.87 0 1.71.09 2.52.26M19.82 15.13C21.16 13.73 22.27 12.23 23 12.5c-.73-1.84-1.84-3.34-3.18-4.37"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Bell Icon (notificações)
const BellIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Settings Icon - Opção 1: Engrenagem clássica com 6 dentes
const SettingsIcon1 = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

// Settings Icon - Opção 2: Engrenagem simples com 8 dentes
const SettingsIcon2 = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Path
      d="M12 1v3m0 16v3M23 12h-3M4 12H1m18.36-6.36-2.12 2.12M6.76 17.24l-2.12 2.12M23 19.07l-2.12-2.12M6.76 6.76 4.64 4.64"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
)

// Settings Icon - Opção 3: Três barras horizontais (mais minimalista)
const SettingsIcon3 = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="12" r="2" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="6" r="2" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="18" r="2" stroke={color} strokeWidth="2" />
    <Path
      d="M8 12h13M3 12h2M8 6h8M3 18h12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
)

// Settings Icon - Opção 3: Três barras horizontais (mais minimalista) ⭐ ATIVO
const SettingsIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="12" r="2" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="6" r="2" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="18" r="2" stroke={color} strokeWidth="2" />
    <Path
      d="M8 12h13M3 12h2M8 6h8M3 18h12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
)

interface HeaderProps {
  hideIcons?: boolean
  onNotificationsPress?: () => void
  onSettingsPress?: () => void
  unreadCount?: number
}

export const Header = memo(function Header({ hideIcons = false, onNotificationsPress, onSettingsPress, unreadCount = 0 }: HeaderProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const { valuesHidden, toggleValuesVisibility } = usePrivacy()
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
          onPress={toggleValuesVisibility}
        >
          {valuesHidden ? (
            <EyeOffIcon color={colors.text} />
          ) : (
            <EyeIcon color={colors.text} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onNotificationsPress}
        >
          <BellIcon color={colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onSettingsPress}
        >
          <SettingsIcon color={colors.text} />
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
