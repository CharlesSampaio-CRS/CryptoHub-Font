import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../contexts/ThemeContext"

export function Header() {
  const { colors } = useTheme()
  
  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>CryptoHub</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Seus investimentos unificados</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.iconText}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

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
    gap: 8,
  },
  iconButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 0.5,
  },
  iconText: {
    fontSize: 14,
    opacity: 0.6,
  },
})
