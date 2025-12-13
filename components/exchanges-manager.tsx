import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, Modal, Pressable, TextInput, Alert } from "react-native"
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { AvailableExchange, LinkedExchange } from "@/types/api"
import { config } from "@/lib/config"

// Mapeamento dos logos locais das exchanges
const exchangeLogos: Record<string, any> = {
  "binance": require("@/assets/binance.png"),
  "novadax": require("@/assets/novadax.png"),
  "mexc": require("@/assets/mexc.png"),
  "coinbase": require("@/assets/coinbase.jpeg"),
  "kraken": require("@/assets/kraken.png"),
  "bybit": require("@/assets/bybit.png"),
  "gate.io": require("@/assets/gateio.png"),
  "kucoin": require("@/assets/kucoin.png"),
  "okx": require("@/assets/okx.png"),
}

export function ExchangesManager() {
  const [availableExchanges, setAvailableExchanges] = useState<AvailableExchange[]>([])
  const [linkedExchanges, setLinkedExchanges] = useState<LinkedExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'linked'>('linked')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // Modal de conexão
  const [connectModalVisible, setConnectModalVisible] = useState(false)
  const [selectedExchange, setSelectedExchange] = useState<AvailableExchange | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [connecting, setConnecting] = useState(false)

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
      
      setAvailableExchanges(availableData.exchanges)
      setLinkedExchanges(linkedData.exchanges)
    } catch (err) {
      setError("Erro ao carregar exchanges")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    
    Alert.alert(
      'Confirmar Desconexão',
      `Tem certeza que deseja desconectar a exchange ${exchangeName}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:5000/api/v1/exchanges/unlink/${exchangeId}`, {
                method: 'DELETE',
              })

              const data = await response.json()

              if (response.ok && data.success) {
                Alert.alert('Sucesso', `Exchange ${exchangeName} desconectada com sucesso!`)
                await fetchExchanges() // Recarregar lista
              } else {
                Alert.alert('Erro', data.error || 'Falha ao desconectar exchange')
              }
            } catch (err) {
              console.error('Erro ao desconectar exchange:', err)
              Alert.alert('Erro', 'Não foi possível desconectar a exchange')
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const handleDelete = async (exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a exchange ${exchangeName}? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:5000/api/v1/exchanges/unlink/${exchangeId}`, {
                method: 'DELETE',
              })

              const data = await response.json()

              if (response.ok && data.success) {
                Alert.alert('Sucesso', `Exchange ${exchangeName} deletada com sucesso!`)
                await fetchExchanges() // Recarregar lista
              } else {
                Alert.alert('Erro', data.error || 'Falha ao deletar exchange')
              }
            } catch (err) {
              console.error('Erro ao deletar exchange:', err)
              Alert.alert('Erro', 'Não foi possível deletar a exchange')
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const toggleMenu = (exchangeId: string) => {
    setOpenMenuId(openMenuId === exchangeId ? null : exchangeId)
  }

  const openConnectModal = (exchange: AvailableExchange) => {
    setSelectedExchange(exchange)
    setApiKey('')
    setApiSecret('')
    setPassphrase('')
    setConnectModalVisible(true)
  }

  const closeConnectModal = () => {
    setConnectModalVisible(false)
    setSelectedExchange(null)
    setApiKey('')
    setApiSecret('')
    setPassphrase('')
  }

  const handleConnect = async () => {
    if (!selectedExchange) return
    
    if (!apiKey.trim() || !apiSecret.trim()) {
      Alert.alert('Erro', 'Por favor, preencha API Key e API Secret')
      return
    }

    if (selectedExchange.requires_passphrase && !passphrase.trim()) {
      Alert.alert('Erro', 'Esta exchange requer uma Passphrase')
      return
    }

    try {
      setConnecting(true)
      
      const response = await fetch('http://localhost:5000/api/v1/exchanges/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: config.userId,
          exchange_id: selectedExchange.ccxt_id,
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          ...(selectedExchange.requires_passphrase && { passphrase: passphrase.trim() })
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        Alert.alert('Sucesso', `Exchange ${selectedExchange.nome} conectada com sucesso!`)
        closeConnectModal()
        await fetchExchanges() // Recarregar lista
      } else {
        Alert.alert('Erro', data.error || 'Falha ao conectar exchange')
      }
    } catch (err) {
      console.error('Erro ao conectar exchange:', err)
      Alert.alert('Erro', 'Não foi possível conectar a exchange')
    } finally {
      setConnecting(false)
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
    <Pressable style={styles.container} onPress={() => setOpenMenuId(null)}>
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
              {linkedExchanges.map((linkedExchange, index) => {
                const exchangeNameLower = linkedExchange.name.toLowerCase()
                const localIcon = exchangeLogos[exchangeNameLower]
                const menuId = linkedExchange.exchange_id + '_' + index
                const isMenuOpen = openMenuId === menuId
                
                return (
                  <View key={menuId} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardLeft}>
                        <View style={styles.iconContainer}>
                          {localIcon ? (
                            <Image 
                              source={localIcon} 
                              style={styles.exchangeIcon}
                              resizeMode="contain"
                            />
                          ) : linkedExchange.icon ? (
                            <Image 
                              source={{ uri: linkedExchange.icon }} 
                              style={styles.exchangeIcon}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text style={styles.iconText}>🔗</Text>
                          )}
                        </View>
                        <View>
                          <Text style={styles.exchangeName}>
                            {linkedExchange.name}
                          </Text>
                          <Text style={[styles.exchangeStatus, styles.statusActive]}>
                            ✓ Conectada
                          </Text>
                        </View>
                      </View>
                      <View>
                        <TouchableOpacity 
                          style={styles.optionsButton}
                          onPress={() => toggleMenu(menuId)}
                        >
                          <Text style={styles.optionsIcon}>⋮</Text>
                        </TouchableOpacity>
                        {isMenuOpen && (
                          <View style={styles.dropdown}>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleDisconnect(linkedExchange.exchange_id, linkedExchange.name)}
                            >
                              <Text style={styles.dropdownItemText}>🔌 Desconectar</Text>
                            </TouchableOpacity>
                            <View style={styles.dropdownDivider} />
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleDelete(linkedExchange.exchange_id, linkedExchange.name)}
                            >
                              <Text style={[styles.dropdownItemText, styles.dropdownItemDanger]}>
                                🗑️ Deletar
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Conectada em:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(linkedExchange.linked_at).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>País:</Text>
                        <Text style={styles.detailValue}>{linkedExchange.country}</Text>
                      </View>
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
                      <TouchableOpacity 
                        style={styles.connectButton}
                        onPress={() => openConnectModal(exchange)}
                      >
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

      {/* Modal de Conexão */}
      <Modal
        visible={connectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeConnectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conectar Exchange</Text>
              <TouchableOpacity onPress={closeConnectModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedExchange && (
              <>
                {/* Info da Exchange */}
                <View style={styles.exchangeInfo}>
                  <View style={styles.iconContainer}>
                    {(() => {
                      const localIcon = exchangeLogos[selectedExchange.nome.toLowerCase()]
                      if (localIcon) {
                        return (
                          <Image 
                            source={localIcon} 
                            style={styles.exchangeIcon}
                            resizeMode="contain"
                          />
                        )
                      } else if (selectedExchange.icon) {
                        return (
                          <Image 
                            source={{ uri: selectedExchange.icon }} 
                            style={styles.exchangeIcon}
                            resizeMode="contain"
                          />
                        )
                      }
                      return <Text style={styles.iconText}>🔗</Text>
                    })()}
                  </View>
                  <View>
                    <Text style={styles.modalExchangeName}>{selectedExchange.nome}</Text>
                    <Text style={styles.modalExchangeCountry}>{selectedExchange.pais_de_origem}</Text>
                  </View>
                </View>

                {/* Formulário */}
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>API Key *</Text>
                    <TextInput
                      style={styles.input}
                      value={apiKey}
                      onChangeText={setApiKey}
                      placeholder="Digite sua API Key"
                      placeholderTextColor="#6b7280"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>API Secret *</Text>
                    <TextInput
                      style={styles.input}
                      value={apiSecret}
                      onChangeText={setApiSecret}
                      placeholder="Digite seu API Secret"
                      placeholderTextColor="#6b7280"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {selectedExchange.requires_passphrase && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Passphrase *</Text>
                      <TextInput
                        style={styles.input}
                        value={passphrase}
                        onChangeText={setPassphrase}
                        placeholder="Digite sua Passphrase"
                        placeholderTextColor="#6b7280"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={styles.inputHint}>
                        ℹ️ Esta exchange requer uma passphrase
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botões */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeConnectModal}
                    disabled={connecting}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, connecting && styles.submitButtonDisabled]}
                    onPress={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Conectar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Pressable>
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
    position: "relative",
    overflow: "visible",
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
  dropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#f9fafb",
    fontWeight: "500",
  },
  dropdownItemDanger: {
    color: "#ef4444",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f9fafb",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#9ca3af",
    fontWeight: "300",
  },
  exchangeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginBottom: 24,
  },
  modalExchangeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f9fafb",
  },
  modalExchangeCountry: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 2,
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f9fafb",
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: "#f9fafb",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  inputHint: {
    fontSize: 12,
    color: "#60a5fa",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9ca3af",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#10b981",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
})
