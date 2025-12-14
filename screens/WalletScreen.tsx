import { Text, StyleSheet, ScrollView, SafeAreaView, View } from "react-native"
import { useTheme } from "../contexts/ThemeContext"

export function WalletScreen() {
  const { colors } = useTheme()
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Estratégias</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Automação de investimentos</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.robotIcon}>🤖</Text>
        </View>
        <Text style={[styles.comingSoon, { color: colors.text }]}>Em breve</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Configure estratégias automáticas de compra e venda{"\n"}
          para suas exchanges e tokens
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Automação</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Execute trades automaticamente
            </Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Estratégias</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              DCA, Stop Loss, Take Profit
            </Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Condições</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Defina regras personalizadas
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  robotIcon: {
    fontSize: 64,
  },
  comingSoon: {
    fontSize: 22,
    fontWeight: "300",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontWeight: "300",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  featuresContainer: {
    width: "100%",
    maxWidth: 400,
    gap: 12,
  },
  featureCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    fontWeight: "300",
    textAlign: "center",
  },
})
