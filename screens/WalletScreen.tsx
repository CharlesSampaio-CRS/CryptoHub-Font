import { Text, StyleSheet, ScrollView, SafeAreaView, View, TouchableOpacity, Alert } from "react-native"
import { useState } from "react"
import { useTheme } from "../contexts/ThemeContext"

interface Strategy {
  id: string
  name: string
  type: string
  exchange: string
  token: string
  isActive: boolean
  conditions: string
  createdAt: Date
}

export function WalletScreen() {
  const { colors } = useTheme()
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: "1",
      name: "DCA Bitcoin",
      type: "DCA",
      exchange: "Binance",
      token: "BTC",
      isActive: true,
      conditions: "Comprar $100 todo dia 1",
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Stop Loss ETH",
      type: "Stop Loss",
      exchange: "Binance",
      token: "ETH",
      isActive: false,
      conditions: "Vender se cair 10%",
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Take Profit SOL",
      type: "Take Profit",
      exchange: "Binance",
      token: "SOL",
      isActive: true,
      conditions: "Vender se subir 20%",
      createdAt: new Date(),
    },
  ])

  const toggleStrategy = (id: string) => {
    setStrategies(prev =>
      prev.map(strategy =>
        strategy.id === id
          ? { ...strategy, isActive: !strategy.isActive }
          : strategy
      )
    )
  }

  const deleteStrategy = (id: string, name: string) => {
    Alert.alert(
      "Excluir Estratégia",
      `Tem certeza que deseja excluir "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            setStrategies(prev => prev.filter(s => s.id !== id))
          },
        },
      ]
    )
  }

  const handleNewStrategy = () => {
    Alert.alert("Em breve", "Funcionalidade de criar estratégia em desenvolvimento")
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Estratégias</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {strategies.length} {strategies.length === 1 ? "estratégia" : "estratégias"}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          onPress={handleNewStrategy}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>+ Nova</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {strategies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma estratégia</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Crie sua primeira estratégia de automação
            </Text>
          </View>
        ) : (
          <View style={styles.strategiesList}>
            {strategies.map((strategy) => (
              <View
                key={strategy.id}
                style={[styles.strategyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.strategyHeader}>
                  <View style={styles.strategyHeaderLeft}>
                    <Text style={[styles.strategyName, { color: colors.text }]}>
                      {strategy.name}
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.typeText, { color: colors.primary }]}>
                        {strategy.type}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.toggle, strategy.isActive && styles.toggleActive]}
                    onPress={() => toggleStrategy(strategy.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        strategy.isActive && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.strategyInfo}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Exchange:
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {strategy.exchange}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Token:
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {strategy.token}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Condição:
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                      {strategy.conditions}
                    </Text>
                  </View>
                </View>

                <View style={styles.strategyFooter}>
                  <View style={[styles.statusBadge, strategy.isActive ? styles.statusActive : styles.statusInactive]}>
                    <View style={[styles.statusDot, { backgroundColor: strategy.isActive ? "#10b981" : "#6b7280" }]} />
                    <Text style={[styles.statusText, { color: strategy.isActive ? "#10b981" : "#6b7280" }]}>
                      {strategy.isActive ? "Ativa" : "Inativa"}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteStrategy(strategy.id, strategy.name)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "400",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "300",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: "300",
    textAlign: "center",
  },
  // Strategies List
  strategiesList: {
    gap: 12,
  },
  strategyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  strategyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  strategyHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "400",
    textTransform: "uppercase",
  },
  // Toggle
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#d4d4d4",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#3b82f6",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  // Strategy Info
  strategyInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "300",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  // Strategy Footer
  strategyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusActive: {},
  statusInactive: {},
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "400",
  },
  deleteButton: {
    padding: 6,
  },
  deleteIcon: {
    fontSize: 18,
  },
})
