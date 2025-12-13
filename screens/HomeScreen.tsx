import { StyleSheet, ScrollView, SafeAreaView } from "react-native"
import { Header } from "../components/Header"
import { PortfolioOverview } from "../components/PortfolioOverview"
import { QuickChart } from "../components/QuickChart"
import { ExchangesList } from "../components/ExchangesList"

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PortfolioOverview />
        <QuickChart />
        <ExchangesList />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
})
