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
  
  // Modal de confirmação (delete/disconnect)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'disconnect' | null>(null)
  const [confirmExchangeId, setConfirmExchangeId] = useState<string>('')
  const [confirmExchangeName, setConfirmExchangeName] = useState<string>('')

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

  const handleConnect = async (exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    
    console.log('handleConnect chamado com:', { exchangeId, exchangeName })
    console.log('🔴 Iniciando reconexão...')
    
    try {
      const url = `${config.apiBaseUrl}/exchanges/connect`
      console.log('🌐 Chamando POST em:', url)
      console.log('📦 Payload:', { user_id: 'charles_test_user', exchange_id: exchangeId })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'charles_test_user',
          exchange_id: exchangeId,
        }),
      })

      console.log('✅ Response status:', response.status)
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (response.ok && data.success) {
        console.log('✅ Sucesso! Exchange conectada')
        
        // Recarregar lista de exchanges
        await fetchExchanges()
        
        // Forçar atualização dos balances
        console.log('🔄 Atualizando balances...')
        await fetch(`${config.apiBaseUrl}/balances?user_id=charles_test_user&force_refresh=true`)
        console.log('✅ Balances atualizados!')
        
        // Notificar outros componentes
        window.dispatchEvent(new Event('balancesUpdated'))
      } else {
        console.log('❌ Erro na resposta:', data.error)
        alert(data.error || 'Falha ao conectar exchange')
      }
    } catch (err) {
      console.error('❌ Erro ao conectar exchange:', err)
      alert('Não foi possível conectar a exchange')
    }
  }

  const handleDisconnect = (exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    setConfirmExchangeId(exchangeId)
    setConfirmExchangeName(exchangeName)
    setConfirmAction('disconnect')
    setConfirmModalVisible(true)
  }

  const confirmDisconnect = async () => {
    console.log('confirmDisconnect chamado com:', { confirmExchangeId, confirmExchangeName })
    setConfirmModalVisible(false)
    
    console.log('🔴 Confirmação aceita! Iniciando chamada...')
    
    try {
      const url = '${config.apiBaseUrl}/exchanges/disconnect'
      console.log('🌐 Chamando POST em:', url)
      console.log('📦 Payload:', { user_id: 'charles_test_user', exchange_id: confirmExchangeId })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'charles_test_user',
          exchange_id: confirmExchangeId,
        }),
      })

      console.log('✅ Response status:', response.status)
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (response.ok && data.success) {
        console.log('✅ Sucesso! Exchange desconectada')
        
        // Recarregar lista de exchanges
        await fetchExchanges()
        
        // Forçar atualização dos balances
        console.log('🔄 Atualizando balances...')
        await fetch(`${config.apiBaseUrl}/balances?user_id=charles_test_user&force_refresh=true`)
        console.log('✅ Balances atualizados!')
        
        // Notificar outros componentes
        window.dispatchEvent(new Event('balancesUpdated'))
      } else {
        console.log('❌ Erro na resposta:', data.error)
        alert(data.error || 'Falha ao desconectar exchange')
      }
    } catch (err) {
      console.error('❌ Erro ao desconectar exchange:', err)
      alert('Não foi possível desconectar a exchange')
    }
  }

  const handleDelete = (exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    setConfirmExchangeId(exchangeId)
    setConfirmExchangeName(exchangeName)
    setConfirmAction('delete')
    setConfirmModalVisible(true)
  }

  const confirmDelete = async () => {
    console.log('confirmDelete chamado com:', { confirmExchangeId, confirmExchangeName })
    setConfirmModalVisible(false)
    
    console.log('🔴 Confirmação aceita! Iniciando chamada DELETE...')
    
    try {
      const url = '${config.apiBaseUrl}/exchanges/delete'
      console.log('🌐 Chamando DELETE em:', url)
      console.log('📦 Payload:', { user_id: 'charles_test_user', exchange_id: confirmExchangeId })
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'charles_test_user',
          exchange_id: confirmExchangeId,
        }),
      })

      console.log('✅ Response status:', response.status)
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (response.ok && data.success) {
        console.log('✅ Sucesso! Exchange deletada')
        
        // Recarregar lista de exchanges
        await fetchExchanges()
        
        // Forçar atualização dos balances
        console.log('🔄 Atualizando balances...')
        await fetch(`${config.apiBaseUrl}/balances?user_id=charles_test_user&force_refresh=true`)
        console.log('✅ Balances atualizados!')
        
        // Notificar outros componentes
        window.dispatchEvent(new Event('balancesUpdated'))
      } else {
        console.log('❌ Erro na resposta:', data.error)
        alert(data.error || 'Falha ao deletar exchange')
      }
    } catch (err) {
      console.error('❌ Erro ao deletar exchange:', err)
      alert('Não foi possível deletar a exchange')
    }
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

  const handleLinkExchange = async () => {
    if (!selectedExchange) return
    
    console.log('🔗 handleLinkExchange chamado')
    console.log('📦 Exchange selecionada:', selectedExchange)
    
    if (!apiKey.trim() || !apiSecret.trim()) {
      alert('Por favor, preencha API Key e API Secret')
      return
    }

    if (selectedExchange.requires_passphrase && !passphrase.trim()) {
      alert('Esta exchange requer uma Passphrase')
      return
    }

    try {
      setConnecting(true)
      
      const url = '${config.apiBaseUrl}/exchanges/link'
      const payload = {
        user_id: config.userId,
        exchange_id: selectedExchange._id, // Usando o _id da exchange
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        ...(selectedExchange.requires_passphrase && { passphrase: passphrase.trim() })
      }
      
      console.log('🌐 Chamando POST em:', url)
      console.log('📦 Payload:', { ...payload, api_key: '***', api_secret: '***', passphrase: '***' })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('✅ Response status:', response.status)
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (response.ok && data.success) {
        console.log('✅ Sucesso! Exchange conectada')
        closeConnectModal()
        
        // Recarregar lista de exchanges
        await fetchExchanges()
        
        // Forçar atualização dos balances
        console.log('🔄 Atualizando balances...')
        await fetch(`${config.apiBaseUrl}/balances?user_id=charles_test_user&force_refresh=true`)
        console.log('✅ Balances atualizados!')
        
        // Notificar outros componentes
        window.dispatchEvent(new Event('balancesUpdated'))
      } else {
        console.log('❌ Erro na resposta:', data.error)
        alert(data.error || 'Falha ao conectar exchange')
      }
    } catch (err) {
      console.error('❌ Erro ao conectar exchange:', err)
      alert('Não foi possível conectar a exchange')
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
                        <View style={styles.exchangeNameContainer}>
                          <Text style={styles.exchangeName}>
                            {linkedExchange.name}
                          </Text>
                          <View style={[
                            styles.statusBadge,
                            linkedExchange.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeInactive
                          ]}>
                            <View style={[
                              styles.statusDot,
                              linkedExchange.status === 'active' ? styles.statusDotActive : styles.statusDotInactive
                            ]} />
                            <Text style={[
                              styles.statusText,
                              linkedExchange.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
                            ]}>
                              {linkedExchange.status === 'active' ? 'Ativa' : 'Inativa'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.optionsButton}
                        onPress={() => toggleMenu(menuId)}
                      >
                        <Text style={styles.optionsIcon}>⋮</Text>
                      </TouchableOpacity>
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

      {/* Modal de Menu de Opções */}
      <Modal
        visible={!!openMenuId}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenMenuId(null)}
      >
        <Pressable 
          style={styles.menuModalOverlay}
          onPress={() => setOpenMenuId(null)}
        >
          <Pressable>
            <View style={styles.menuModal}>
              {(() => {
                const index = openMenuId ? parseInt(openMenuId.split('_')[1]) : -1
                const exchange = index >= 0 ? linkedExchanges[index] : null
                const isActive = exchange?.status === 'active'
                
                return (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation()
                        if (exchange) {
                          if (isActive) {
                            console.log('Desativar - Exchange:', exchange)
                            handleDisconnect(exchange.exchange_id, exchange.name)
                          } else {
                            console.log('Ativar - Exchange:', exchange)
                            handleConnect(exchange.exchange_id, exchange.name)
                          }
                        }
                      }}
                    >
                      <Text style={styles.menuItemText}>
                        {isActive ? 'Desativar' : 'Ativar'}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.menuDivider} />
                    
                    <TouchableOpacity
                      style={styles.menuItem}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation()
                        if (exchange) {
                          console.log('Deletar - Exchange:', exchange)
                          handleDelete(exchange.exchange_id, exchange.name)
                        }
                      }}
                    >
                      <Text style={[styles.menuItemText, styles.menuItemDanger]}>Deletar</Text>
                    </TouchableOpacity>
                  </>
                )
              })()}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
                    onPress={handleLinkExchange}
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

      {/* Modal de Confirmação (Delete/Disconnect) */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setConfirmModalVisible(false)}
        >
          <Pressable 
            style={styles.confirmModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.confirmModalHeader}>
              <Text style={styles.confirmModalTitle}>
                {confirmAction === 'delete' ? '⚠️ Confirmar Exclusão' : '⚠️ Confirmar Desconexão'}
              </Text>
            </View>

            <View style={styles.confirmModalBody}>
              <Text style={styles.confirmModalMessage}>
                {confirmAction === 'delete' 
                  ? `Tem certeza que deseja deletar permanentemente a exchange ${confirmExchangeName}? Esta ação não pode ser desfeita.`
                  : `Tem certeza que deseja desconectar a exchange ${confirmExchangeName}?`
                }
              </Text>
            </View>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.confirmCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmitButton, confirmAction === 'delete' && styles.confirmDeleteButton]}
                onPress={() => {
                  if (confirmAction === 'delete') {
                    confirmDelete()
                  } else {
                    confirmDisconnect()
                  }
                }}
              >
                <Text style={styles.confirmSubmitButtonText}>
                  {confirmAction === 'delete' ? 'Deletar' : 'Desconectar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  // Menu Modal Styles
  menuModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModal: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    minWidth: 200,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: 15,
    color: "#f9fafb",
    fontWeight: "500",
  },
  menuItemDanger: {
    color: "#ef4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
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
  exchangeNameContainer: {
    flex: 1,
  },
  exchangeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusBadgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statusBadgeInactive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: "#10b981",
  },
  statusDotInactive: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#10b981",
  },
  statusTextInactive: {
    color: "#ef4444",
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
  confirmModalContent: {
    backgroundColor: "#141414",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  confirmModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f9fafb",
  },
  confirmModalBody: {
    padding: 20,
  },
  confirmModalMessage: {
    fontSize: 15,
    color: "#d1d5db",
    lineHeight: 22,
  },
  confirmModalActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  confirmCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9ca3af",
  },
  confirmSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f59e0b",
    alignItems: "center",
  },
  confirmDeleteButton: {
    backgroundColor: "#ef4444",
  },
  confirmSubmitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
})
