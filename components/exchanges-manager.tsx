import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView } from "react-native"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { AvailableExchange, LinkedExchange } from "@/types/api"
import { config } from "@/lib/config"

// Mapeamento dos logos locais das exchanges
const exchangeLogos: Record<string, any> = {
  "Binance": require("@/assets/binance.png"),
  "NovaDAX": require("@/assets/novadax.png"),
  "MEXC": require("@/assets/mexc.png"),
  "Coinbase": require("@/assets/coinbase.jpeg"),
  "Kraken": require("@/assets/kraken.png"),
  "Bybit": require("@/assets/bybit.png"),
  "Gate.io": require("@/assets/gateio.png"),
  "KuCoin": require("@/assets/kucoin.png"),
  "OKX": require("@/assets/okx.png"),
}

export function ExchangesManager() {
  const [availableExchanges, setAvailableExchanges] = useState<AvailableExchange[]>([])
  const [linkedExchanges, setLinkedExchanges] = useState<LinkedExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'linked'>('linked')

  useEffect(() => {
    fetchExchanges()
  }, [])

  const fetchExchanges = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [availableData, linkedData] = await Promise.all([
        apiService.getAvailableExchanges(config.userId),
        apiService.getLinkedExchanges(config.userId)
      ])
      
      console.log('Available exchanges:', availableData)
      console.log('Linked exchanges:', linkedData)
      
      setAvailableExchanges(availableData.exchanges)
      setLinkedExchanges(linkedData.exchanges)
    } catch (err) {
      setError("Erro ao carregar exchanges")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Carregando exchanges...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExchanges}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gerenciar Exchanges</Text>
        <Text style={styles.headerSubtitle}>
          {linkedExchanges.length} conectada{linkedExchanges.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'linked' && styles.tabActive]}
          onPress={() => setActiveTab('linked')}
        >
          <Text style={[styles.tabText, activeTab === 'linked' && styles.tabTextActive]}>
            Conectadas ({linkedExchanges.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Disponíveis ({availableExchanges.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'linked' ? (
          linkedExchanges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={styles.emptyTitle}>Nenhuma exchange conectada</Text>
              <Text style={styles.emptyText}>
                Conecte suas exchanges para visualizar seus ativos
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setActiveTab('available')}
              >
                <Text style={styles.primaryButtonText}>Ver Exchanges Disponíveis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {linkedExchanges.map((linkedExchange) => {
                // Buscar dados da exchange disponível para pegar ícone e nome correto
                const exchangeInfo = availableExchanges.find(
                  ex => ex._id === linkedExchange.exchange_id
                )
                
                return (
                  <View key={linkedExchange._id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardLeft}>
                        <View style={styles.iconContainer}>
                          {(() => {
                            const exchangeName = exchangeInfo?.nome || linkedExchange.exchange_name || ''
                            const localIcon = exchangeLogos[exchangeName.toLowerCase()]
                            
                            if (localIcon) {
                              return (
                                <Image 
                                  source={localIcon} 
                                  style={styles.exchangeIcon}
                                  resizeMode="contain"
                                />
                              )
                            } else if (exchangeInfo?.icon) {
                              return (
                                <Image 
                                  source={{ uri: exchangeInfo.icon }} 
                                  style={styles.exchangeIcon}
                                  resizeMode="contain"
                                />
                              )
                            } else {
                              return <Text style={styles.iconText}>🔗</Text>
                            }
                          })()}
                        </View>
                        <View>
                          <Text style={styles.exchangeName}>
                            {exchangeInfo?.nome || linkedExchange.exchange_name || 'Exchange'}
                          </Text>
                          <Text style={[
                            styles.exchangeStatus,
                            linkedExchange.is_active ? styles.statusActive : styles.statusInactive
                          ]}>
                            {linkedExchange.is_active ? '✓ Ativa' : '✗ Inativa'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.optionsButton}>
                        <Text style={styles.optionsIcon}>⋮</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Conectada em:</Text>
                        <Text style={styles.detailValue}>
                          {linkedExchange.created_at 
                            ? new Date(linkedExchange.created_at).toLocaleDateString('pt-BR')
                            : 'N/A'
                          }
                        </Text>
                      </View>
                      {exchangeInfo?.pais_de_origem && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>País:</Text>
                          <Text style={styles.detailValue}>{exchangeInfo.pais_de_origem}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          )
        ) : (
          <View style={styles.list}>
            {availableExchanges.map((exchange) => {
              const isLinked = linkedExchanges.some(
                linked => linked.exchange_id === exchange._id
              )
              
              return (
                <View key={exchange._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <View style={styles.iconContainer}>
                        {(() => {
                          const localIcon = exchangeLogos[exchange.nome.toLowerCase()]
                          
                          if (localIcon) {
                            return (
                              <Image 
                                source={localIcon} 
                                style={styles.exchangeIcon}
                                resizeMode="contain"
                              />
                            )
                          } else if (exchange.icon) {
                            return (
                              <Image 
                                source={{ uri: exchange.icon }} 
                                style={styles.exchangeIcon}
                                resizeMode="contain"
                              />
                            )
                          } else {
                            return <Text style={styles.iconText}>🔗</Text>
                          }
                        })()}
                      </View>
                      <View>
                        <Text style={styles.exchangeName}>{exchange.nome}</Text>
                        <Text style={styles.exchangeCountry}>{exchange.pais_de_origem}</Text>
                      </View>
                    </View>
                    {isLinked ? (
                      <View style={styles.connectedBadge}>
                        <Text style={styles.connectedBadgeText}>✓ Conectada</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.connectButton}>
                        <Text style={styles.connectButtonText}>Conectar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {exchange.requires_passphrase && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>ℹ️ Requer passphrase</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
    padding: 20,
  },
  retryButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#141414",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  tabActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconText: {
    fontSize: 24,
  },
  exchangeIcon: {
    width: 40,
    height: 40,
  },
  exchangeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 2,
  },
  exchangeStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusActive: {
    color: "#10b981",
  },
  statusInactive: {
    color: "#ef4444",
  },
  exchangeCountry: {
    fontSize: 12,
    color: "#6b7280",
  },
  optionsButton: {
    padding: 8,
  },
  optionsIcon: {
    fontSize: 20,
    color: "#9ca3af",
  },
  cardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 13,
    color: "#f9fafb",
    fontWeight: "500",
  },
  connectedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  connectedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
  },
  connectButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
  infoBox: {
    marginTop: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  infoText: {
    fontSize: 12,
    color: "#60a5fa",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
})
