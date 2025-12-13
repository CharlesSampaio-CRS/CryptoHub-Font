import { Text, StyleSheet, ScrollView, SafeAreaView } from "react-native"
import { Header } from "../components/Header"

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Perfil" subtitle="Configurações da conta" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.comingSoon}>Em breve</Text>
        <Text style={styles.description}>Gerencie suas preferências e configurações</Text>
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
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
})
