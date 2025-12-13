import { StyleSheet, ScrollView, SafeAreaView } from "react-native"
import { Header } from "../components/Header"
import { PortfolioOverview } from "../components/PortfolioOverview"
import { QuickChart } from "../components/QuickChart"
import { ExchangesList } from "../components/ExchangesList"
import { useTheme } from "../contexts/ThemeContext"

export function HomeScreen() {
  const { colors } = useTheme()
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
})
