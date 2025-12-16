import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ExchangesManager } from "../components/exchanges-manager"
import { useTheme } from "../contexts/ThemeContext"

export function ExchangesScreen({ route }: any) {
  const { colors } = useTheme()
  const openTab = route?.params?.openTab || 'linked'
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ExchangesManager initialTab={openTab} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
