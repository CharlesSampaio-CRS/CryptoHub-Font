import { StyleSheet, SafeAreaView } from "react-native"
import { ExchangesManager } from "../components/exchanges-manager"

export function ExchangesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ExchangesManager />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
})
