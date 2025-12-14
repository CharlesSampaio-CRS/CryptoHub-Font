import { Text, StyleSheet, ScrollView, SafeAreaView } from "react-native"
import { Header } from "../components/Header"

export function WalletScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Carteira" subtitle="Seus ativos" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.comingSoon}>Em breve</Text>
        <Text style={styles.description}>Visualize todos os seus ativos detalhadamente</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: "500",
    color: "#f9fafb",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
})
