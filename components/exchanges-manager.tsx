import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, Modal, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, Clipboard } from "react-native"
import { useEffect, useState, useMemo } from "react"
import { apiService } from "@/services/api"
import { AvailableExchange, LinkedExchange } from "@/types/api"
import { config } from "@/lib/config"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { useBalance } from "@/contexts/BalanceContext"
import { QRScanner } from "./QRScanner"
import Svg, { Path } from "react-native-svg"

// Mapeamento dos logos locais das exchanges
const exchangeLogos: Record<string, any> = {
  "binance": require("@/assets/binance.png"),
  "novadax": require("@/assets/novadax.png"),
  "mexc": require("@/assets/mexc.png"),
  "coinbase": require("@/assets/coinbase.png"),
  "kraken": require("@/assets/kraken.png"),
  "bybit": require("@/assets/bybit.png"),
  "gate.io": require("@/assets/gateio.png"),
  "kucoin": require("@/assets/kucoin.png"),
  "okx": require("@/assets/okx.png"),
}

interface ExchangesManagerProps {
  initialTab?: 'available' | 'linked'
}

export function ExchangesManager({ initialTab = 'linked' }: ExchangesManagerProps) {
  const { t } = useLanguage()
  const { colors } = useTheme()
  const { refreshOnExchangeChange } = useBalance()
  const [availableExchanges, setAvailableExchanges] = useState<AvailableExchange[]>([])
  const [linkedExchanges, setLinkedExchanges] = useState<LinkedExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'available' | 'linked'>(initialTab)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // Modal de conexão
  const [connectModalVisible, setConnectModalVisible] = useState(false)
  const [selectedExchange, setSelectedExchange] = useState<AvailableExchange | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [qrScannerVisible, setQrScannerVisible] = useState(false)
  const [currentScanField, setCurrentScanField] = useState<'apiKey' | 'apiSecret' | 'passphrase' | null>(null)
  
  // Modal de confirmação (delete/disconnect)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'disconnect' | null>(null)
  const [confirmExchangeId, setConfirmExchangeId] = useState<string>('')
  const [confirmExchangeName, setConfirmExchangeName] = useState<string>('')
  
  // Modal de confirmação de toggle
  const [confirmToggleModalVisible, setConfirmToggleModalVisible] = useState(false)
  const [toggleExchangeId, setToggleExchangeId] = useState<string>('')
  const [toggleExchangeName, setToggleExchangeName] = useState<string>('')
  const [toggleExchangeNewStatus, setToggleExchangeNewStatus] = useState<string>('')

  useEffect(() => {
    fetchExchanges()
  }, [])

  const fetchExchanges = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching exchanges... forceRefresh:', forceRefresh)
      
      const [availableData, linkedData] = await Promise.all([
        apiService.getAvailableExchanges(config.userId, forceRefresh),
        apiService.getLinkedExchanges(config.userId, forceRefresh)
      ])
      
      console.log('✅ Exchanges fetched:', {
        available: availableData.exchanges?.length || 0,
        linked: linkedData.exchanges?.length || 0
      })
      
      setAvailableExchanges(availableData.exchanges || [])
      setLinkedExchanges(linkedData.exchanges || [])
    } catch (err) {
      console.error('❌ Error fetching exchanges:', err)
      setError("Erro ao carregar exchanges")
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    
    try {
      const url = `${config.apiBaseUrl}/exchanges/connect`
      
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

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('🔗 Exchange conectada, atualizando dados...')
        
        // Recarregar lista de exchanges sem cache
        await fetchExchanges(true)
        
        // Atualizar balances com cache:false
        await refreshOnExchangeChange()
      } else {
        alert(data.error || 'Falha ao conectar exchange')
      }
    } catch (err) {
      alert('Não foi possível conectar a exchange')
    }
  }

  // Mostra modal de confirmação para toggle
  const toggleExchange = (exchangeId: string, currentStatus: string, exchangeName: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    setToggleExchangeId(exchangeId)
    setToggleExchangeName(exchangeName)
    setToggleExchangeNewStatus(newStatus)
    setConfirmToggleModalVisible(true)
  }

  // Executa o toggle após confirmação
  const confirmToggle = async () => {
    const exchangeId = toggleExchangeId
    const newStatus = toggleExchangeNewStatus
    const currentStatus = toggleExchangeNewStatus === 'active' ? 'inactive' : 'active'
    
    setConfirmToggleModalVisible(false)
    
    console.log(`🔄 Toggling exchange ${exchangeId}: ${currentStatus} → ${newStatus}`)
    
    // Atualização otimista
    setLinkedExchanges(prev =>
      prev.map(ex =>
        ex.exchange_id === exchangeId ? { ...ex, status: newStatus as 'active' | 'inactive' } : ex
      )
    )

    try {
      console.log(`🔄 Status da exchange atualizado: ${exchangeId} → ${newStatus}`)
      
      // Atualizar balances com cache:false (toggle afeta quais exchanges são incluídas)
      await refreshOnExchangeChange()
      
      // Em React Native, não precisamos de window.dispatchEvent
    } catch (error) {
      console.error("Error toggling exchange:", error)
      // Reverte em caso de erro
      setLinkedExchanges(prev =>
        prev.map(ex =>
          ex.exchange_id === exchangeId ? { ...ex, status: currentStatus as 'active' | 'inactive' } : ex
        )
      )
      alert("Não foi possível atualizar o status da exchange")
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
    setConfirmModalVisible(false)
    
    
    try {
      const url = `${config.apiBaseUrl}/exchanges/disconnect`
      
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

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('🔌 Exchange desconectada, atualizando dados...')
        
        // Recarregar lista de exchanges sem cache
        await fetchExchanges(true)
        
        // Atualizar balances com cache:false
        await refreshOnExchangeChange()
        
        // Em React Native, não precisamos de window.dispatchEvent
      } else {
        alert(data.error || 'Falha ao desconectar exchange')
      }
    } catch (err) {
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
    setConfirmModalVisible(false)
    
    
    try {
      const url = `${config.apiBaseUrl}/exchanges/delete`
      
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

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('🗑️ Exchange deletada, atualizando dados...')
        
        // Pequeno delay para garantir que o backend processou
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Recarregar lista de exchanges sem cache
        await fetchExchanges(true)
        
        // Atualizar balances com cache:false
        await refreshOnExchangeChange()
      } else {
        alert(data.error || 'Falha ao deletar exchange')
      }
    } catch (err) {
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
    setQrScannerVisible(false)
    setCurrentScanField(null)
  }

  const handleOpenQRScanner = (field: 'apiKey' | 'apiSecret' | 'passphrase') => {
    setCurrentScanField(field)
    setQrScannerVisible(true)
  }

  const handleQRScanned = (data: string) => {
    // Tenta parsear JSON se for um QR code estruturado
    try {
      const parsed = JSON.parse(data)
      if (parsed.apiKey) setApiKey(parsed.apiKey)
      if (parsed.apiSecret) setApiSecret(parsed.apiSecret)
      if (parsed.passphrase) setPassphrase(parsed.passphrase)
    } catch {
      // Se não for JSON, coloca o texto no campo atual
      if (currentScanField === 'apiKey') setApiKey(data)
      else if (currentScanField === 'apiSecret') setApiSecret(data)
      else if (currentScanField === 'passphrase') setPassphrase(data)
    }
    setQrScannerVisible(false)
    setCurrentScanField(null)
  }

  const handlePasteFromClipboard = async (field: 'apiKey' | 'apiSecret' | 'passphrase') => {
    try {
      const text = await Clipboard.getString()
      if (text) {
        if (field === 'apiKey') setApiKey(text.trim())
        else if (field === 'apiSecret') setApiSecret(text.trim())
        else if (field === 'passphrase') setPassphrase(text.trim())
        
        Alert.alert('✅ Colado!', 'Texto colado da área de transferência')
      } else {
        Alert.alert('⚠️ Área vazia', 'Não há texto na área de transferência')
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível colar da área de transferência')
    }
  }

  const handleLinkExchange = async () => {
    if (!selectedExchange) return
    
    
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
      
      const url = `${config.apiBaseUrl}/exchanges/link`
      const payload = {
        user_id: config.userId,
        exchange_id: selectedExchange._id, // Usando o _id da exchange
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        ...(selectedExchange.requires_passphrase && { passphrase: passphrase.trim() })
      }
      
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('🔗 Exchange linkada, atualizando dados...')
        closeConnectModal()
        
        // Pequeno delay para garantir que o backend processou
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Recarregar lista de exchanges sem cache
        await fetchExchanges(true)
        
        // Atualizar balances com cache:false
        await refreshOnExchangeChange()
      } else {
        alert(data.error || 'Falha ao conectar exchange')
      }
    } catch (err) {
      alert('Não foi possível conectar a exchange')
    } finally {
      setConnecting(false)
    }
  }

  // Estilos dinâmicos baseados no tema
  const themedStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    card: { backgroundColor: colors.surface, borderColor: colors.border },
    modal: { backgroundColor: colors.surface },
    input: { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
    button: { backgroundColor: colors.primary },
    tabActive: { backgroundColor: colors.primary },
    tabInactive: { backgroundColor: colors.surfaceSecondary },
  }), [colors])

  if (loading) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando exchanges...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, themedStyles.button]} onPress={() => fetchExchanges(true)}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Pressable style={[styles.container, themedStyles.container]} onPress={() => setOpenMenuId(null)}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('exchanges.manage')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {activeTab === 'linked' 
              ? `${linkedExchanges.length} ${linkedExchanges.length === 1 ? t('exchanges.connectedSingular') : t('exchanges.connectedPlural')}`
              : `${availableExchanges.length} ${availableExchanges.length === 1 ? t('exchanges.availableSingular') : t('exchanges.availablePlural')}`
            }
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'linked' ? themedStyles.tabActive : themedStyles.tabInactive]}
          onPress={() => setActiveTab('linked')}
        >
          <Text style={[styles.tabText, activeTab === 'linked' && { color: '#ffffff' }, activeTab !== 'linked' && { color: colors.textSecondary }]}>
            {t('exchanges.connected')} ({linkedExchanges.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' ? themedStyles.tabActive : themedStyles.tabInactive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && { color: '#ffffff' }, activeTab !== 'available' && { color: colors.textSecondary }]}>
            {t('exchanges.available')} ({availableExchanges.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'linked' ? (
          linkedExchanges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home.noData')}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('exchanges.connectModal')}
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, themedStyles.button]}
                onPress={() => setActiveTab('available')}
              >
                <Text style={styles.primaryButtonText}>{t('exchanges.viewAvailable')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {linkedExchanges.map((linkedExchange, index) => {
                const exchangeNameLower = linkedExchange.name.toLowerCase()
                const localIcon = exchangeLogos[exchangeNameLower]
                const exchangeId = linkedExchange.exchange_id
                const isActive = linkedExchange.status === 'active'
                
                return (
                  <View key={exchangeId + '_' + index} style={[styles.card, themedStyles.card]}>
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
                          <Text style={[styles.exchangeName, { color: colors.text }]}>
                            {linkedExchange.name}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
                        onPress={() => toggleExchange(exchangeId, linkedExchange.status, linkedExchange.name)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.cardDetails}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('exchanges.connectedAt')}</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {new Date(linkedExchange.linked_at).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    </View>

                    {/* Footer com status e delete */}
                    <View style={styles.exchangeFooter}>
                      <View style={[
                        styles.statusBadge,
                        isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
                      ]}>
                        <View style={[
                          styles.statusDot,
                          isActive ? styles.statusDotActive : styles.statusDotInactive
                        ]} />
                        <Text style={[
                          styles.statusText,
                          isActive ? styles.statusTextActive : styles.statusTextInactive
                        ]}>
                          {isActive ? t('strategy.active') : t('strategy.inactive')}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(exchangeId, linkedExchange.name)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
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
                <View key={exchange._id} style={[styles.card, themedStyles.card]}>
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
                        <Text style={[styles.exchangeName, { color: colors.text }]}>{exchange.nome}</Text>
                      </View>
                    </View>
                    {isLinked ? (
                      <View style={[styles.connectedBadge, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                        <Text style={[styles.connectedBadgeText, { color: colors.success }]}>✓ Conectada</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.connectButton, themedStyles.button]}
                        onPress={() => openConnectModal(exchange)}
                      >
                        <Text style={styles.connectButtonText}>{t('exchanges.connect')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {exchange.requires_passphrase && (
                    <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                      <Text style={[styles.infoText, { color: colors.primary }]}>ℹ️ Requer passphrase</Text>
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
            <View style={[styles.menuModal, themedStyles.modal]}>
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
                            handleDisconnect(exchange.exchange_id, exchange.name)
                          } else {
                            handleConnect(exchange.exchange_id, exchange.name)
                          }
                        }
                      }}
                    >
                      <Text style={[styles.menuItemText, { color: colors.text }]}>
                        {isActive ? t('exchanges.deactivate') : t('exchanges.activate')}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                    
                    <TouchableOpacity
                      style={styles.menuItem}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation()
                        if (exchange) {
                          handleDelete(exchange.exchange_id, exchange.name)
                        }
                      }}
                    >
                      <Text style={[styles.menuItemText, { color: colors.danger }]}>{t('exchanges.delete')}</Text>
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, themedStyles.modal]}>
              {/* Header do Modal */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('exchanges.connectModal')}</Text>
                <TouchableOpacity onPress={closeConnectModal} style={styles.closeButton}>
                  <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
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
                    <Text style={[styles.modalExchangeName, { color: colors.text }]}>{selectedExchange.nome}</Text>
                  </View>
                </View>

                {/* Formulário */}
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>API Key *</Text>
                    <View style={styles.inputWithButtons}>
                      <TextInput
                        style={[styles.inputWithIcons, themedStyles.input]}
                        value={apiKey}
                        onChangeText={setApiKey}
                        placeholderTextColor={colors.textSecondary}
                        placeholder="Digite sua API Key"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <View style={styles.inputActions}>
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary }]}
                          onPress={() => handlePasteFromClipboard('apiKey')}
                        >
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </Svg>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleOpenQRScanner('apiKey')}
                        >
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M7 8h2v2H7V8zM15 8h2v2h-2V8zM7 14h2v2H7v-2zM15 14h2v2h-2v-2z" fill="#ffffff"/>
                          </Svg>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>API Secret *</Text>
                    <View style={styles.inputWithButtons}>
                      <TextInput
                        style={[styles.inputWithIcons, themedStyles.input]}
                        value={apiSecret}
                        onChangeText={setApiSecret}
                        placeholder="Digite seu API Secret"
                        placeholderTextColor={colors.textSecondary}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <View style={styles.inputActions}>
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary }]}
                          onPress={() => handlePasteFromClipboard('apiSecret')}
                        >
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </Svg>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleOpenQRScanner('apiSecret')}
                        >
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M7 8h2v2H7V8zM15 8h2v2h-2V8zM7 14h2v2H7v-2zM15 14h2v2h-2v-2z" fill="#ffffff"/>
                          </Svg>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {selectedExchange.requires_passphrase && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Passphrase *</Text>
                      <View style={styles.inputWithButtons}>
                        <TextInput
                          style={[styles.inputWithIcons, themedStyles.input]}
                          value={passphrase}
                          onChangeText={setPassphrase}
                          placeholder="Digite sua Passphrase"
                          placeholderTextColor={colors.textSecondary}
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <View style={styles.inputActions}>
                          <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.surfaceSecondary }]}
                            onPress={() => handlePasteFromClipboard('passphrase')}
                          >
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </Svg>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.primary }]}
                            onPress={() => handleOpenQRScanner('passphrase')}
                          >
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <Path d="M7 8h2v2H7V8zM15 8h2v2h-2V8zM7 14h2v2H7v-2zM15 14h2v2h-2v-2z" fill="#ffffff"/>
                            </Svg>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                        ℹ️ Esta exchange requer uma passphrase
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botões */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={closeConnectModal}
                    disabled={connecting}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, themedStyles.button, connecting && styles.submitButtonDisabled]}
                    onPress={handleLinkExchange}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>{t('exchanges.connect')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Confirmação de Toggle */}
      <Modal
        visible={confirmToggleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmToggleModalVisible(false)}
      >
        <Pressable 
          style={styles.confirmModalOverlay}
          onPress={() => setConfirmToggleModalVisible(false)}
        >
          <Pressable 
            style={[styles.confirmModalContent, themedStyles.modal]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.confirmModalHeader}>
              <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
                {toggleExchangeNewStatus === 'active' ? `✅ ${t('exchanges.activate')} ${t('exchanges.title').slice(0, -1)}` : `⏸️ ${t('exchanges.deactivate')} ${t('exchanges.title').slice(0, -1)}`}
              </Text>
            </View>

            <View style={styles.confirmModalBody}>
              <Text style={[styles.confirmModalMessage, { color: colors.textSecondary }]}>
                {toggleExchangeNewStatus === 'active' 
                  ? `${t('exchanges.activateConfirm')} ${toggleExchangeName}? ${t('exchanges.activateWarning')}`
                  : `${t('exchanges.deactivateConfirm')} ${toggleExchangeName}? ${t('exchanges.deactivateWarning')}`
                }
              </Text>
            </View>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.confirmCancelButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setConfirmToggleModalVisible(false)}
              >
                <Text style={[styles.confirmCancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmitButton, themedStyles.button]}
                onPress={confirmToggle}
              >
                <Text style={styles.confirmSubmitButtonText}>
                  {toggleExchangeNewStatus === 'active' ? t('exchanges.activate') : t('exchanges.deactivate')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Confirmação (Delete/Disconnect) */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <Pressable 
          style={styles.confirmModalOverlay}
          onPress={() => setConfirmModalVisible(false)}
        >
          <Pressable 
            style={[styles.confirmModalContent, themedStyles.modal]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.confirmModalHeader}>
              <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
                {confirmAction === 'delete' ? '⚠️ Confirmar Exclusão' : '⚠️ Confirmar Desconexão'}
              </Text>
            </View>

            <View style={styles.confirmModalBody}>
              <Text style={[styles.confirmModalMessage, { color: colors.textSecondary }]}>
                {confirmAction === 'delete' 
                  ? `${t('exchanges.deleteConfirm')} ${confirmExchangeName}? ${t('exchanges.deleteWarning')}`
                  : `${t('exchanges.disconnectConfirm')} ${confirmExchangeName}?`
                }
              </Text>
            </View>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.confirmCancelButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={[styles.confirmCancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmitButton, confirmAction === 'delete' ? { backgroundColor: colors.danger } : themedStyles.button]}
                onPress={() => {
                  if (confirmAction === 'delete') {
                    confirmDelete()
                  } else {
                    confirmDisconnect()
                  }
                }}
              >
                <Text style={styles.confirmSubmitButtonText}>
                  {confirmAction === 'delete' ? t('exchanges.delete') : t('exchanges.disconnect')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={qrScannerVisible}
        onClose={() => {
          setQrScannerVisible(false)
          setCurrentScanField(null)
        }}
        onScan={handleQRScanned}
        title={
          currentScanField === 'apiKey' 
            ? 'Escanear API Key' 
            : currentScanField === 'apiSecret'
            ? 'Escanear API Secret'
            : 'Escanear Passphrase'
        }
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7ff",
  },
  // Menu Modal Styles
  menuModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModal: {
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbdefb",
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
    fontWeight: "500",
  },
  menuItemDanger: {
    color: "#ef4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#bbdefb",
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
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "300",
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
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  tabActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "400",
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e3f2fd",
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
    fontWeight: "400",
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
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
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
    backgroundColor: "#3b82f6",
  },
  statusDotInactive: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "400",
  },
  statusTextActive: {
    color: "#3b82f6",
  },
  statusTextInactive: {
    color: "#ef4444",
  },
  exchangeStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusActive: {
    color: "#3b82f6",
  },
  statusInactive: {
    color: "#ef4444",
  },
  exchangeCountry: {
    fontSize: 12,
    color: "#6b7280",
  },
  // Toggle Button
  toggleButton: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#d4d4d4",
    padding: 2,
    justifyContent: "center",
  },
  toggleButtonActive: {
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
  // Exchange Footer
  exchangeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  deleteButton: {
    padding: 6,
  },
  deleteIcon: {
    fontSize: 18,
  },
  cardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e3f2fd",
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
    fontWeight: "500",
  },
  connectedBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  connectedBadgeText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#3b82f6",
  },
  connectButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: "400",
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
    fontWeight: "500",
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
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#ffffff",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
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
    fontWeight: "500",
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
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    marginBottom: 24,
  },
  modalExchangeName: {
    fontSize: 18,
    fontWeight: "400",
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
    fontWeight: "400",
  },
  input: {
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  inputWithButtons: {
    position: 'relative',
  },
  inputWithIcons: {
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 14,
    paddingRight: 96,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  inputActions: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -18 }],
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#9ca3af",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#ffffff",
  },
  // Confirm Modal (centralizado)
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "400",
    textAlign: "center",
    color: "#111827",
  },
  confirmModalBody: {
    padding: 24,
  },
  confirmModalMessage: {
    fontSize: 15,
    fontWeight: "300",
    lineHeight: 22,
    textAlign: "center",
    color: "#374151",
  },
  confirmModalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  confirmCancelButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  confirmCancelButtonText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#6b7280",
  },
  confirmSubmitButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
  },
  confirmDeleteButton: {
    backgroundColor: "#ef4444",
  },
  confirmSubmitButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#ffffff",
  },
})
