import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, Clipboard, SafeAreaView } from "react-native"
import { useEffect, useState, useMemo, useCallback, memo } from "react"
import { apiService } from "@/services/api"
import { AvailableExchange, LinkedExchange } from "@/types/api"
import { config } from "@/lib/config"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { useBalance } from "@/contexts/BalanceContext"
import { QRScanner } from "./QRScanner"
import { LogoIcon } from "./LogoIcon"
import { AnimatedLogoIcon } from "./AnimatedLogoIcon"
import { typography, fontWeights } from "@/lib/typography"
import Svg, { Path } from "react-native-svg"

// Mapeamento dos logos locais das exchanges
const exchangeLogos: Record<string, any> = {
  "binance": require("@/assets/binance.png"),
  "novadax": require("@/assets/novadax.png"),
  "mexc": require("@/assets/mexc.png"),
  "coinbase": require("@/assets/coinbase.png"),
  "coinex": require("@/assets/coinex.png"),
  "bitget": require("@/assets/bitget.png"),
  "kraken": require("@/assets/kraken.png"),
  "bybit": require("@/assets/bybit.png"),
  "gate.io": require("@/assets/gateio.png"),
  "kucoin": require("@/assets/kucoin.png"),
  "okx": require("@/assets/okx.png"),
}

interface ExchangesManagerProps {
  initialTab?: 'available' | 'linked'
}

// Subcomponente memoizado para renderizar cada card de exchange
const LinkedExchangeCard = memo(({ 
  linkedExchange, 
  index, 
  colors, 
  t, 
  onToggle, 
  onDelete,
  onPress
}: { 
  linkedExchange: any
  index: number
  colors: any
  t: any
  onToggle: (id: string, status: string, name: string) => void
  onDelete: (id: string, name: string) => void
  onPress: () => void
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const exchangeNameLower = linkedExchange.name.toLowerCase()
  const localIcon = exchangeLogos[exchangeNameLower]
  const exchangeId = linkedExchange.exchange_id
  const isActive = linkedExchange.status === 'active'
  const isDark = colors.isDark

  // Themed styles for toggle (seguindo padrão do HomeScreen)
  const themedToggleStyles = useMemo(() => ({
    toggleButton: { 
      backgroundColor: isDark ? 'rgba(60, 60, 60, 0.4)' : 'rgba(200, 200, 200, 0.3)',
      borderColor: isDark ? 'rgba(80, 80, 80, 0.3)' : 'rgba(180, 180, 180, 0.2)',
    },
    toggleButtonActive: { 
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
    },
    toggleThumb: { 
      backgroundColor: isDark ? 'rgba(140, 140, 140, 0.9)' : 'rgba(100, 100, 100, 0.7)',
    },
    toggleThumbActive: { 
      backgroundColor: isDark ? 'rgba(96, 165, 250, 0.9)' : 'rgba(59, 130, 246, 0.8)',
    },
  }), [isDark])
  
  const formattedDate = useMemo(() => {
    return new Date(linkedExchange.linked_at).toLocaleDateString('pt-BR')
  }, [linkedExchange.linked_at])

  const themedStyles = useMemo(() => ({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    statusDotActive: {
      backgroundColor: colors.primary,
    },
    statusDotInactive: {
      backgroundColor: colors.danger,
    },
  }), [colors])

  return (
    <View style={[styles.compactCard, { backgroundColor: colors.surface, zIndex: 1000 - index, elevation: 1000 - index }]}>
      <TouchableOpacity 
        style={styles.compactRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Ícone */}
        <View style={styles.compactIconContainer}>
          {localIcon ? (
            <Image 
              source={localIcon} 
              style={styles.compactIcon}
              resizeMode="contain"
            />
          ) : linkedExchange.icon ? (
            <Image 
              source={{ uri: linkedExchange.icon }} 
              style={styles.compactIcon}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.iconText}>🔗</Text>
          )}
        </View>
        
        {/* Nome */}
        <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1}>
          {linkedExchange.name}
        </Text>
        
        {/* Data */}
        <Text style={[styles.compactDate, { color: colors.textSecondary }]} numberOfLines={1}>
          {formattedDate}
        </Text>
        
        {/* Toggle */}
        <TouchableOpacity 
          style={[
            styles.compactToggle, 
            themedToggleStyles.toggleButton,
            isActive && themedToggleStyles.toggleButtonActive
          ]}
          onPress={(e) => {
            e.stopPropagation()
            onToggle(exchangeId, linkedExchange.status, linkedExchange.name)
          }}
          activeOpacity={0.7}
        >
          <View style={[
            styles.compactToggleThumb, 
            themedToggleStyles.toggleThumb,
            isActive && themedToggleStyles.toggleThumbActive
          ]} />
        </TouchableOpacity>
        
        {/* Menu três pontos */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>⋮</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      
      {/* Menu dropdown */}
      {showMenu && (
        <View style={[styles.menuDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.deleteMenuItem}
            onPress={(e) => {
              e.stopPropagation()
              setShowMenu(false)
              onDelete(exchangeId, linkedExchange.name)
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.deleteMenuText, { color: colors.danger }]}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
})

LinkedExchangeCard.displayName = 'LinkedExchangeCard'

// Subcomponente memoizado para exchanges disponíveis
const AvailableExchangeCard = memo(({ 
  exchange, 
  isLinked, 
  colors, 
  t, 
  onConnect,
  onPress
}: { 
  exchange: any
  isLinked: boolean
  colors: any
  t: any
  onConnect: (exchange: any) => void
  onPress: () => void
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const localIcon = exchangeLogos[exchange.nome.toLowerCase()]
  
  const themedStyles = useMemo(() => ({
    card: {
      backgroundColor: colors.surface,
    },
  }), [colors])

  return (
    <View style={[styles.availableCard, themedStyles.card]}>
      <TouchableOpacity 
        style={styles.availableRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Ícone */}
        <View style={styles.availableIconContainer}>
          {localIcon ? (
            <Image 
              source={localIcon} 
              style={styles.availableIcon}
              resizeMode="contain"
            />
          ) : exchange.icon ? (
            <Image 
              source={{ uri: exchange.icon }} 
              style={styles.availableIcon}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.iconText}>🔗</Text>
          )}
        </View>
        
        {/* Nome */}
        <Text style={[styles.availableName, { color: colors.text }]} numberOfLines={1}>
          {exchange.nome}
        </Text>
        
        {/* Info sobre passphrase */}
        {exchange.requires_passphrase && (
          <TouchableOpacity
            onLongPress={() => setShowTooltip(true)}
            onPressOut={() => setShowTooltip(false)}
            delayLongPress={300}
            style={styles.infoIconButton}
          >
            <Text style={[styles.availableInfo, { color: colors.primary }]}>
              ℹ️
            </Text>
            {showTooltip && (
              <View style={[styles.passphraseTooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.passphraseTooltipText, { color: colors.text }]}>
                  Requer passphrase
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        {/* Badge de status ou botão conectar */}
        {isLinked ? (
          <View style={[styles.connectedBadgeCompact, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.connectedBadgeTextCompact, { color: colors.success }]}>✓</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.connectBadge, { backgroundColor: 'transparent', borderWidth: 0.5, borderColor: '#3B82F6' }]}
            onPress={(e) => {
              e.stopPropagation()
              onConnect(exchange)
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.connectBadgeText, { color: '#3B82F6' }]}>
              {t('exchanges.connect')}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  )
})

AvailableExchangeCard.displayName = 'AvailableExchangeCard'

export function ExchangesManager({ initialTab = 'linked' }: ExchangesManagerProps) {
  const { t } = useLanguage()
  const { colors, isDark } = useTheme()
  const { refreshOnExchangeChange, data: balanceData } = useBalance()
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
  
  // Modal de detalhes da exchange
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [detailsExchange, setDetailsExchange] = useState<any>(null)
  const [detailsType, setDetailsType] = useState<'linked' | 'available'>('linked')
  const [detailsFullData, setDetailsFullData] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const fetchExchanges = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      
      const [availableData, linkedData] = await Promise.all([
        apiService.getAvailableExchanges(config.userId, forceRefresh),
        apiService.getLinkedExchanges(config.userId, forceRefresh)
      ])
      
      setAvailableExchanges(availableData.exchanges || [])
      setLinkedExchanges(linkedData.exchanges || [])
    } catch (err) {
      console.error('❌ Error fetching exchanges:', err)
      setError("Erro ao carregar exchanges")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExchanges(true) // SEMPRE força refresh para pegar ícones atualizados
  }, [fetchExchanges])

  // Atualiza exchanges quando trocar de aba (força refresh para pegar dados atualizados do banco)
  useEffect(() => {
    if (activeTab === 'available') {
      fetchExchanges(true) // força refresh sem cache
    }
  }, [activeTab, fetchExchanges])

  const handleConnect = useCallback(async (exchangeId: string, exchangeName: string) => {
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
        // Recarregar lista de exchanges sem cache
        await fetchExchanges(true)
        
        // Atualizar balances com cache:false
        await refreshOnExchangeChange()
      } else {
        alert(data.error || t('error.connectExchange'))
      }
    } catch (err) {
      alert(t('error.connectExchange'))
    }
  }, [fetchExchanges, refreshOnExchangeChange])

  // Mostra modal de confirmação para toggle
  const toggleExchange = useCallback((exchangeId: string, currentStatus: string, exchangeName: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    setToggleExchangeId(exchangeId)
    setToggleExchangeName(exchangeName)
    setToggleExchangeNewStatus(newStatus)
    setConfirmToggleModalVisible(true)
  }, [])

  // Executa o toggle após confirmação
  const confirmToggle = useCallback(async () => {
    const exchangeId = toggleExchangeId
    const newStatus = toggleExchangeNewStatus
    const currentStatus = toggleExchangeNewStatus === 'active' ? 'inactive' : 'active'
    
    setConfirmToggleModalVisible(false)
    
    
    // Atualização otimista
    setLinkedExchanges(prev =>
      prev.map(ex =>
        ex.exchange_id === exchangeId ? { ...ex, status: newStatus as 'active' | 'inactive' } : ex
      )
    )

    try {
      
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
      alert(t("error.updateExchangeStatus"))
    }
  }, [toggleExchangeId, toggleExchangeNewStatus, refreshOnExchangeChange])

  const handleDisconnect = useCallback((exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    setConfirmExchangeId(exchangeId)
    setConfirmExchangeName(exchangeName)
    setConfirmAction('disconnect')
    setConfirmModalVisible(true)
  }, [])

  const confirmDisconnect = useCallback(async () => {
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
        
        // Recarregar lista de exchanges sem cache
        await fetchExchanges(true)
        
        // Atualizar balances com cache:false
        await refreshOnExchangeChange()
        
        // Em React Native, não precisamos de window.dispatchEvent
      } else {
        alert(data.error || t('error.disconnectExchange'))
      }
    } catch (err) {
      alert(t('error.disconnectExchange'))
    }
  }, [confirmExchangeId, fetchExchanges, refreshOnExchangeChange])

  const handleDelete = useCallback((exchangeId: string, exchangeName: string) => {
    setOpenMenuId(null)
    setConfirmExchangeId(exchangeId)
    setConfirmExchangeName(exchangeName)
    setConfirmAction('delete')
    setConfirmModalVisible(true)
  }, [])

  const confirmDelete = useCallback(async () => {
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
        
        // Pequeno delay para garantir que o backend processou
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Recarregar lista de exchanges sem cache
        await fetchExchanges(true)
        
        // Atualizar balances com cache:false
        await refreshOnExchangeChange()
      } else {
        alert(data.error || t('error.deleteExchange'))
      }
    } catch (err) {
      alert(t('error.deleteExchange'))
    }
  }, [confirmExchangeId, fetchExchanges, refreshOnExchangeChange])

  const toggleMenu = useCallback((exchangeId: string) => {
    setOpenMenuId(openMenuId === exchangeId ? null : exchangeId)
  }, [openMenuId])

  const openConnectModal = useCallback((exchange: AvailableExchange) => {
    setSelectedExchange(exchange)
    setApiKey('')
    setApiSecret('')
    setPassphrase('')
    setConnecting(false) // Reset loading state
    setConnectModalVisible(true)
  }, [])

  const closeConnectModal = useCallback(() => {
    setConnectModalVisible(false)
    setSelectedExchange(null)
    setApiKey('')
    setApiSecret('')
    setPassphrase('')
    setQrScannerVisible(false)
    setCurrentScanField(null)
    setConnecting(false) // Reset loading state
  }, [])

  // Funções para modal de detalhes
  const openDetailsModal = useCallback(async (exchange: any, type: 'linked' | 'available') => {
    setDetailsExchange(exchange)
    setDetailsType(type)
    setDetailsModalVisible(true)
    setLoadingDetails(true)
    setDetailsFullData(null)
    
    try {
      // Busca detalhes completos da exchange
      const exchangeId = type === 'linked' ? exchange.exchange_id : exchange._id
      const fullData = await apiService.getExchangeFullDetails(exchangeId, true, true)
      setDetailsFullData(fullData)
    } catch (error) {
      console.error('❌ Error loading exchange details:', error)
      // Continua mostrando o modal com os dados básicos
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  const closeDetailsModal = useCallback(() => {
    setDetailsModalVisible(false)
    setDetailsExchange(null)
    setDetailsFullData(null)
    setLoadingDetails(false)
  }, [])

  const handleOpenQRScanner = useCallback((field: 'apiKey' | 'apiSecret' | 'passphrase') => {
    setCurrentScanField(field)
    setQrScannerVisible(true)
  }, [])

  const handleQRScanned = useCallback((data: string) => {
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
  }, [currentScanField])

  const handlePasteFromClipboard = useCallback(async (field: 'apiKey' | 'apiSecret' | 'passphrase') => {
    try {
      const text = await Clipboard.getString()
      if (text) {
        if (field === 'apiKey') setApiKey(text.trim())
        else if (field === 'apiSecret') setApiSecret(text.trim())
        else if (field === 'passphrase') setPassphrase(text.trim())
        
        Alert.alert(`✅ ${t('success.pastedClipboard')}`, t('success.textPasted'))
      } else {
        Alert.alert(`⚠️ ${t('warning.emptyClipboard')}`, t('warning.noClipboardText'))
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('error.pasteClipboard'))
    }
  }, [t])

  const handleLinkExchange = useCallback(async () => {
    if (!selectedExchange) return
    
    
    if (!apiKey.trim() || !apiSecret.trim()) {
      alert(t('error.fillApiKeys'))
      return
    }

    if (selectedExchange.requires_passphrase && !passphrase.trim()) {
      alert(t('error.passphraseRequired'))
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
        closeConnectModal()
        
        // Pequeno delay para garantir que o backend processou
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Atualizar exchanges e balances em paralelo para ser mais rápido
        await Promise.all([
          fetchExchanges(true),
          refreshOnExchangeChange()
        ])
        
      } else {
        console.error('❌ Falha ao linkar exchange:', data.error)
        alert(data.error || t('error.connectExchange'))
      }
    } catch (err) {
      console.error('❌ Erro ao linkar exchange:', err)
      alert(t('error.connectExchange'))
    } finally {
      setConnecting(false)
    }
  }, [selectedExchange, apiKey, apiSecret, passphrase, closeConnectModal, fetchExchanges, refreshOnExchangeChange, t])

  // Estilos dinâmicos baseados no tema
  const themedStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    card: { backgroundColor: colors.card, borderColor: colors.cardBorder },
    modal: { backgroundColor: colors.surface },
    modalContent: { backgroundColor: colors.surface },
    menuModal: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    menuDivider: { backgroundColor: colors.border },
    
    // Text colors
    menuItemDanger: { color: colors.danger },
    loadingText: { color: colors.textSecondary },
    errorText: { color: colors.danger },
    retryButtonText: { color: colors.textInverse },
    
    // Tabs
    tabs: { borderBottomColor: colors.border },
    tab: { borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { color: colors.textSecondary },
    tabTextActive: { color: colors.text, fontWeight: '600' },
    
    // Status
    statusTextActive: { color: colors.primary },
    statusTextInactive: { color: colors.danger },
    statusActive: { color: colors.primary },
    statusInactive: { color: colors.danger },
    exchangeCountry: { color: colors.textSecondary },
    
    // Details
    detailLabel: { color: colors.textSecondary },
    
    // Connected Badge
    connectedBadge: { 
      backgroundColor: colors.primaryLight + '20',
      borderColor: colors.primary 
    },
    
    // Connect Button
    connectButtonText: { color: colors.primary },
    
    // Info Box
    infoBox: { 
      backgroundColor: colors.infoLight,
      borderColor: colors.primary + '40'
    },
    infoText: { color: colors.primary },
    
    // Empty State
    emptyText: { color: colors.textSecondary },
    
    // Primary Button
    primaryButtonText: { color: colors.primary },
    
    // Exchange Info
    exchangeInfo: { backgroundColor: colors.surfaceSecondary },
    
    // Modal Exchange Country
    modalExchangeCountry: { color: colors.textSecondary },
    
    // Input
    input: { 
      backgroundColor: colors.input,
      borderColor: colors.inputBorder,
      color: colors.text 
    },
    inputWithIcons: { 
      backgroundColor: colors.input,
      borderColor: colors.inputBorder,
      color: colors.text 
    },
    inputHint: { color: colors.primaryLight },
    
    // Cancel Button
    cancelButton: { 
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border 
    },
    cancelButtonText: { color: colors.textSecondary },
    
    // Submit Button
    submitButtonText: { color: colors.primary },
    
    // Confirm Modal
    confirmModalContent: { backgroundColor: colors.surface },
  }), [colors])

  if (loading) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <View style={styles.loadingContainer}>
          <AnimatedLogoIcon size={48} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando exchanges...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={() => fetchExchanges(true)}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LogoIcon size={24} />
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('exchanges.manage')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {activeTab === 'linked' 
                ? `${linkedExchanges.length} ${linkedExchanges.length === 1 ? t('exchanges.connectedSingular') : t('exchanges.connectedPlural')}`
                : `${availableExchanges.length} ${availableExchanges.length === 1 ? t('exchanges.availableSingular') : t('exchanges.availablePlural')}`
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, themedStyles.tabs]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'linked' ? themedStyles.tabActive : themedStyles.tab]}
          onPress={() => setActiveTab('linked')}
        >
          <Text style={[styles.tabText, activeTab === 'linked' ? themedStyles.tabTextActive : themedStyles.tabText]}>
            {t('exchanges.connected')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' ? themedStyles.tabActive : themedStyles.tab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' ? themedStyles.tabTextActive : themedStyles.tabText]}>
            {t('exchanges.available')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'linked' ? (
          linkedExchanges.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home.noData')}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('exchanges.connectModal')}
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                onPress={() => setActiveTab('available')}
              >
                <Text style={styles.primaryButtonText}>{t('exchanges.viewAvailable')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {linkedExchanges.map((linkedExchange, index) => (
                <LinkedExchangeCard
                  key={linkedExchange.exchange_id + '_' + index}
                  linkedExchange={linkedExchange}
                  index={index}
                  colors={colors}
                  t={t}
                  onToggle={toggleExchange}
                  onDelete={handleDelete}
                  onPress={() => openDetailsModal(linkedExchange, 'linked')}
                />
              ))}
            </>
          )
        ) : (
          <>
            {availableExchanges.map((exchange) => {
              const isLinked = linkedExchanges.some(
                linked => linked.exchange_id === exchange._id
              )
              
              return (
                <AvailableExchangeCard
                  key={exchange._id}
                  exchange={exchange}
                  isLinked={isLinked}
                  colors={colors}
                  t={t}
                  onConnect={openConnectModal}
                  onPress={() => openDetailsModal(exchange, 'available')}
                />
              )
            })}
          </>
        )}
      </ScrollView>

      {/* Modal de Menu de Opções */}
      <Modal
        visible={!!openMenuId}
        transparent
        animationType="slide"
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
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.safeArea}
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
                            <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={colors.textInverse} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M7 8h2v2H7V8zM15 8h2v2h-2V8zM7 14h2v2H7v-2zM15 14h2v2h-2v-2z" fill={colors.textInverse}/>
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
                            <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={colors.textInverse} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <Path d="M7 8h2v2H7V8zM15 8h2v2h-2V8zM7 14h2v2H7v-2zM15 14h2v2h-2v-2z" fill={colors.textInverse}/>
                          </Svg>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {selectedExchange.requires_passphrase && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Passphrase *</Text>
                      <TextInput
                        style={[styles.input, themedStyles.input]}
                        value={passphrase}
                        onChangeText={setPassphrase}
                        placeholder="Digite sua Passphrase"
                        placeholderTextColor={colors.textSecondary}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
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
                    style={[styles.submitButton, { backgroundColor: colors.surface, borderColor: colors.primary }, connecting && styles.submitButtonDisabled]}
                    onPress={handleLinkExchange}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <AnimatedLogoIcon size={20} />
                    ) : (
                      <Text style={[styles.submitButtonText, { color: colors.primary }]}>{t('exchanges.connect')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal de Confirmação de Toggle */}
      <Modal
        visible={confirmToggleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmToggleModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.confirmModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.confirmModalContent, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.confirmModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
                  {toggleExchangeNewStatus === 'active' ? `✅ ${t('exchanges.activate')} ${t('exchanges.title').slice(0, -1)}` : `⏸️ ${t('exchanges.deactivate')} ${t('exchanges.title').slice(0, -1)}`}
                </Text>
                <TouchableOpacity onPress={() => setConfirmToggleModalVisible(false)} style={styles.confirmModalCloseButton}>
                  <Text style={[styles.confirmModalCloseIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.confirmModalBody}>
                <Text style={[styles.confirmModalMessage, { color: colors.textSecondary }]}>
                  {toggleExchangeNewStatus === 'active' 
                    ? `${t('exchanges.activateConfirm')} ${toggleExchangeName}? ${t('exchanges.activateWarning')}`
                    : `${t('exchanges.deactivateConfirm')} ${toggleExchangeName}? ${t('exchanges.deactivateWarning')}`
                  }
                </Text>
              </View>

              {/* Footer Actions */}
              <View style={[styles.confirmModalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.confirmModalButton, { backgroundColor: colors.surface }]}
                  onPress={() => setConfirmToggleModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmModalButtonText, { color: colors.text }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmModalButton, { backgroundColor: colors.primary }]}
                  onPress={confirmToggle}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmModalButtonText, { color: '#ffffff' }]}>
                    {toggleExchangeNewStatus === 'active' ? t('exchanges.activate') : t('exchanges.deactivate')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Confirmação (Delete/Disconnect) */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.confirmModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.confirmModalContent, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.confirmModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
                  {confirmAction === 'delete' ? '⚠️ Confirmar Exclusão' : '⚠️ Confirmar Desconexão'}
                </Text>
                <TouchableOpacity onPress={() => setConfirmModalVisible(false)} style={styles.confirmModalCloseButton}>
                  <Text style={[styles.confirmModalCloseIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.confirmModalBody}>
                <Text style={[styles.confirmModalMessage, { color: colors.textSecondary }]}>
                  {confirmAction === 'delete' 
                    ? `${t('exchanges.deleteConfirm')} ${confirmExchangeName}? ${t('exchanges.deleteWarning')}`
                    : `${t('exchanges.disconnectConfirm')} ${confirmExchangeName}?`
                  }
                </Text>
              </View>

              {/* Footer Actions */}
              <View style={[styles.confirmModalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.confirmModalButton, { backgroundColor: colors.surface }]}
                  onPress={() => setConfirmModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmModalButtonText, { color: colors.text }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmModalButton, 
                    { backgroundColor: confirmAction === 'delete' ? colors.danger : colors.primary }
                  ]}
                  onPress={() => {
                    if (confirmAction === 'delete') {
                      confirmDelete()
                    } else {
                      confirmDisconnect()
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmModalButtonText, { color: '#ffffff' }]}>
                    {confirmAction === 'delete' ? t('exchanges.delete') : t('exchanges.disconnect')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Detalhes da Exchange */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDetailsModal}
      >
        <KeyboardAvoidingView 
          style={styles.confirmModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.detailsModalContent, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.confirmModalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
                  {detailsType === 'linked' ? '🔗 Exchange Conectada' : '🌐 Detalhes da Exchange'}
                </Text>
                <TouchableOpacity onPress={closeDetailsModal} style={styles.confirmModalCloseButton}>
                  <Text style={[styles.confirmModalCloseIcon, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView style={styles.detailsModalScroll} showsVerticalScrollIndicator={true}>
                {detailsExchange && (
                  <View style={styles.detailsModalBody}>
                    {/* Ícone e Nome da Exchange */}
                    <View style={[styles.detailsHeader, { backgroundColor: colors.surfaceSecondary }]}>
                      <View style={styles.detailsIconContainer}>
                        {(() => {
                          const exchangeName = detailsType === 'linked' 
                            ? detailsExchange.name?.toLowerCase() 
                            : detailsExchange.nome?.toLowerCase()
                          const localIcon = exchangeLogos[exchangeName]
                          const iconUrl = detailsType === 'linked' 
                            ? detailsExchange.icon 
                            : detailsExchange.icon
                          
                          if (localIcon) {
                            return (
                              <Image 
                                source={localIcon} 
                                style={styles.detailsExchangeIcon}
                                resizeMode="contain"
                              />
                            )
                          } else if (iconUrl) {
                            return (
                              <Image 
                                source={{ uri: iconUrl }} 
                                style={styles.detailsExchangeIcon}
                                resizeMode="contain"
                              />
                            )
                          }
                          return <Text style={styles.detailsIconText}>🔗</Text>
                        })()}
                      </View>
                      <View style={styles.detailsHeaderText}>
                        <Text style={[styles.detailsExchangeName, { color: colors.text }]}>
                          {detailsType === 'linked' ? detailsExchange.name : detailsExchange.nome}
                        </Text>
                      </View>
                    </View>

                    {/* Informações */}
                    <View style={styles.detailsSection}>
                      <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                         Informações Gerais
                      </Text>
                      
                      {loadingDetails ? (
                        <View style={styles.detailsLoadingContainer}>
                          <AnimatedLogoIcon size={32} />
                          <Text style={[styles.detailsLoadingText, { color: colors.textSecondary }]}>
                            Carregando detalhes...
                          </Text>
                        </View>
                      ) : (
                        <>
                          {detailsType === 'linked' ? (
                            <>
                              <View style={styles.detailsInfoRow}>
                                <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                  Nome:
                                </Text>
                                <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                  {detailsExchange.name}
                                </Text>
                              </View>
                              
                              <View style={styles.detailsInfoRow}>
                                <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                  Exchange ID:
                                </Text>
                                <Text style={[styles.detailsInfoValue, { color: colors.text }]} numberOfLines={1}>
                                  {detailsExchange.exchange_id}
                                </Text>
                              </View>
                              
                              {detailsFullData?.ccxt_id && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    CCXT ID:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                    {detailsFullData.ccxt_id}
                                  </Text>
                                </View>
                              )}
                              
                              {(detailsExchange.country || detailsFullData?.pais_de_origem) && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    País:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                    {detailsExchange.country || detailsFullData?.pais_de_origem || 'N/A'}
                                  </Text>
                                </View>
                              )}
                              
                              {(detailsExchange.url || detailsFullData?.url) && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    Website:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.primary }]} numberOfLines={1}>
                                    {detailsExchange.url || detailsFullData?.url}
                                  </Text>
                                </View>
                              )}
                              
                              <View style={styles.detailsInfoRow}>
                                <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                  Conectada em:
                                </Text>
                                <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                  {new Date(detailsExchange.linked_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Text>
                              </View>
                              
                              {detailsExchange.updated_at && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    Última atualização:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                    {new Date(detailsExchange.updated_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                </View>
                              )}
                              
                              {detailsExchange.reconnected_at && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    Reconectada em:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.success }]}>
                                    {new Date(detailsExchange.reconnected_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                </View>
                              )}
                              
                              {detailsExchange.disconnected_at && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    Desconectada em:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.danger }]}>
                                    {new Date(detailsExchange.disconnected_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                </View>
                              )}
                              
                              <View style={styles.detailsInfoRow}>
                                <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                  Status:
                                </Text>
                                <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                  {detailsExchange.status === 'active' ? 'Ativa ✓' : 'Inativa ✗'}
                                </Text>
                              </View>
                            </>
                          ) : (
                            <>
                              <View style={styles.detailsInfoRow}>
                                <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                  Nome:
                                </Text>
                                <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                  {detailsExchange.nome}
                                </Text>
                              </View>
                              
                              <View style={styles.detailsInfoRow}>
                                <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                  Exchange ID:
                                </Text>
                                <Text style={[styles.detailsInfoValue, { color: colors.text }]} numberOfLines={1}>
                                  {detailsExchange._id}
                                </Text>
                              </View>
                              
                              {detailsFullData?.ccxt_id && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    CCXT ID:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                    {detailsFullData.ccxt_id}
                                  </Text>
                                </View>
                              )}
                              
                              {detailsExchange.pais_de_origem && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    País de Origem:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.text }]}>
                                    {detailsExchange.pais_de_origem}
                                  </Text>
                                </View>
                              )}
                              
                              {detailsExchange.url && (
                                <View style={styles.detailsInfoRow}>
                                  <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                    Website:
                                  </Text>
                                  <Text style={[styles.detailsInfoValue, { color: colors.primary }]} numberOfLines={1}>
                                    {detailsExchange.url}
                                  </Text>
                                </View>
                              )}
                              
                              <View style={styles.detailsInfoRow}>
                                <Text style={[styles.detailsInfoLabel, { color: colors.textSecondary }]}>
                                  Requer Passphrase:
                                </Text>
                                <Text style={[styles.detailsInfoValue, { color: detailsExchange.requires_passphrase ? colors.primary : colors.textSecondary }]}>
                                  {detailsExchange.requires_passphrase ? 'Sim ✓' : 'Não'}
                                </Text>
                              </View>
                            </>
                          )}
                        </>
                      )}
                    </View>

                    {/* Recursos (se disponível) */}
                    {detailsType === 'available' && (
                      <View style={styles.detailsSection}>
                        <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                          ⚡ Recursos
                        </Text>
                        <View style={[styles.detailsFeatureBox, { backgroundColor: colors.surfaceSecondary }]}>
                          <Text style={[styles.detailsFeatureText, { color: colors.text }]}>
                            • Trading de criptomoedas
                          </Text>
                          <Text style={[styles.detailsFeatureText, { color: colors.text }]}>
                            • API para integração
                          </Text>
                          <Text style={[styles.detailsFeatureText, { color: colors.text }]}>
                            • Suporte a múltiplas moedas
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Taxas (Fees) */}
                    {detailsFullData?.fees && (
                      <View style={styles.detailsSection}>
                        <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                          💰 Taxas
                        </Text>
                        
                        {detailsFullData.fees.trading && (
                          <View style={[styles.detailsFeesBox, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.detailsFeesTitle, { color: colors.text }]}>Trading:</Text>
                            
                            {detailsFullData.fees.trading.maker !== undefined && detailsFullData.fees.trading.maker !== null && (
                              <View style={styles.detailsFeeRow}>
                                <Text style={[styles.detailsFeeLabel, { color: colors.textSecondary }]}>
                                  • Maker:
                                </Text>
                                <Text style={[styles.detailsFeeValue, { color: colors.text }]}>
                                  {typeof detailsFullData.fees.trading.maker === 'number'
                                    ? `${(detailsFullData.fees.trading.maker * 100).toFixed(4)}%`
                                    : String(detailsFullData.fees.trading.maker)}
                                </Text>
                              </View>
                            )}
                            
                            {detailsFullData.fees.trading.taker !== undefined && detailsFullData.fees.trading.taker !== null && (
                              <View style={styles.detailsFeeRow}>
                                <Text style={[styles.detailsFeeLabel, { color: colors.textSecondary }]}>
                                  • Taker:
                                </Text>
                                <Text style={[styles.detailsFeeValue, { color: colors.text }]}>
                                  {typeof detailsFullData.fees.trading.taker === 'number'
                                    ? `${(detailsFullData.fees.trading.taker * 100).toFixed(4)}%`
                                    : String(detailsFullData.fees.trading.taker)}
                                </Text>
                              </View>
                            )}
                            
                            {detailsFullData.fees.trading.percentage !== undefined && (
                              <View style={styles.detailsFeeRow}>
                                <Text style={[styles.detailsFeeLabel, { color: colors.textSecondary }]}>
                                  • Tipo:
                                </Text>
                                <Text style={[styles.detailsFeeValue, { color: colors.text }]}>
                                  {detailsFullData.fees.trading.percentage ? 'Percentual' : 'Fixo'}
                                </Text>
                              </View>
                            )}
                            
                            {detailsFullData.fees.trading.tierBased !== undefined && (
                              <View style={styles.detailsFeeRow}>
                                <Text style={[styles.detailsFeeLabel, { color: colors.textSecondary }]}>
                                  • Por nível:
                                </Text>
                                <Text style={[styles.detailsFeeValue, { color: colors.text }]}>
                                  {detailsFullData.fees.trading.tierBased ? 'Sim' : 'Não'}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        
                        {detailsFullData.fees.funding && (
                          <View style={[styles.detailsFeesBox, { backgroundColor: colors.surfaceSecondary, marginTop: 12 }]}>
                            <Text style={[styles.detailsFeesTitle, { color: colors.text }]}>Funding:</Text>
                            
                            {detailsFullData.fees.funding.withdraw !== undefined && detailsFullData.fees.funding.withdraw !== null && (
                              <View style={styles.detailsFeeRow}>
                                <Text style={[styles.detailsFeeLabel, { color: colors.textSecondary }]}>
                                  • Retirada:
                                </Text>
                                <Text style={[styles.detailsFeeValue, { color: colors.text }]}>
                                  {typeof detailsFullData.fees.funding.withdraw === 'object' 
                                    ? 'Varia por moeda'
                                    : typeof detailsFullData.fees.funding.withdraw === 'number'
                                    ? `${(detailsFullData.fees.funding.withdraw * 100).toFixed(4)}%`
                                    : String(detailsFullData.fees.funding.withdraw)}
                                </Text>
                              </View>
                            )}
                            
                            {detailsFullData.fees.funding.deposit !== undefined && detailsFullData.fees.funding.deposit !== null && (
                              <View style={styles.detailsFeeRow}>
                                <Text style={[styles.detailsFeeLabel, { color: colors.textSecondary }]}>
                                  • Depósito:
                                </Text>
                                <Text style={[styles.detailsFeeValue, { color: colors.text }]}>
                                  {typeof detailsFullData.fees.funding.deposit === 'object' 
                                    ? 'Varia por moeda'
                                    : typeof detailsFullData.fees.funding.deposit === 'number'
                                    ? `${(detailsFullData.fees.funding.deposit * 100).toFixed(4)}%`
                                    : String(detailsFullData.fees.funding.deposit)}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        
                        {/* Mostra estrutura completa se houver mais dados */}
                        {detailsFullData.fees && !detailsFullData.fees.trading && !detailsFullData.fees.funding && (
                          <View style={[styles.detailsFeesBox, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.detailsFeatureText, { color: colors.text }]}>
                              Estrutura de taxas disponível na exchange
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Mercados (Markets) */}
                    {detailsFullData?.markets && Object.keys(detailsFullData.markets).length > 0 && (
                      <View style={styles.detailsSection}>
                        <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                          📈 Mercados Disponíveis
                        </Text>
                        <View style={[styles.detailsMarketsBox, { backgroundColor: colors.surfaceSecondary }]}>
                          <Text style={[styles.detailsMarketsCount, { color: colors.text }]}>
                            {Object.keys(detailsFullData.markets).length} pares de trading disponíveis
                          </Text>
                          <View style={styles.detailsMarketsSample}>
                            {Object.keys(detailsFullData.markets).slice(0, 5).map((market, index) => (
                              <View key={index} style={[styles.detailsMarketChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                                <Text style={[styles.detailsMarketText, { color: colors.primary }]}>
                                  {market}
                                </Text>
                              </View>
                            ))}
                            {Object.keys(detailsFullData.markets).length > 5 && (
                              <Text style={[styles.detailsMarketsMore, { color: colors.textSecondary }]}>
                                +{Object.keys(detailsFullData.markets).length - 5} mais
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Capacidades (Has) */}
                    {detailsFullData?.has && (
                      <View style={styles.detailsSection}>
                        <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                          ✨ Capacidades da API
                        </Text>
                        <View style={[styles.detailsCapabilitiesBox, { backgroundColor: colors.surfaceSecondary }]}>
                          {Object.entries(detailsFullData.has)
                            .filter(([key, value]) => value === true)
                            .slice(0, 10)
                            .map(([key, value], index) => (
                              <View key={index} style={styles.detailsCapabilityRow}>
                                <Text style={[styles.detailsCapabilityText, { color: colors.text }]}>
                                  ✓ {key.replace(/([A-Z])/g, ' $1').trim()}
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Informações de Segurança */}
                    <View style={styles.detailsSection}>
                      <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>
                        🔒 Segurança
                      </Text>
                      <View style={[styles.detailsSecurityBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                        <Text style={[styles.detailsSecurityText, { color: colors.text }]}>
                          {detailsType === 'linked' 
                            ? '✓ Suas credenciais estão criptografadas e seguras'
                            : 'ℹ️ Ao conectar, suas API Keys serão criptografadas'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Footer Actions */}
              <View style={[styles.detailsModalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.confirmModalButton, { backgroundColor: colors.surface }]}
                  onPress={closeDetailsModal}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.confirmModalButtonText, { color: colors.text }]}>
                    Fechar
                  </Text>
                </TouchableOpacity>
                
                {detailsType === 'available' && !linkedExchanges.some(
                  linked => linked.exchange_id === detailsExchange?._id
                ) && (
                  <TouchableOpacity
                    style={[styles.confirmModalButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      closeDetailsModal()
                      openConnectModal(detailsExchange)
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.confirmModalButtonText, { color: '#ffffff' }]}>
                      Conectar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Menu Modal Styles
  menuModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModal: {
    borderRadius: 12,
    borderWidth: 1,
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
  },
  menuDivider: {
    height: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "400",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerText: {
    flexDirection: "column",
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: "300",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: typography.caption,
    marginTop: 2,
    fontWeight: "300",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
  },
  tabText: {
    fontSize: typography.body,
    fontWeight: "400",
  },
  tabTextActive: {
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 80,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100, // Espaço extra no final para o scroll
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 0,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 3,
    borderWidth: 0,
  },
  iconText: {
    fontSize: 20,
  },
  exchangeIcon: {
    width: "100%",
    height: "100%",
  },
  exchangeNameContainer: {
    flex: 1,
  },
  exchangeName: {
    fontSize: typography.body,
    fontWeight: "400",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    // Cor definida dinamicamente via themedStyles
  },
  statusDotInactive: {
    // Cor definida dinamicamente via themedStyles
  },
  statusText: {
    fontSize: typography.caption,
    fontWeight: "400",
  },
  statusTextActive: {
  },
  statusTextInactive: {
  },
  exchangeStatus: {
    fontSize: 11,
    fontWeight: "400",
  },
  statusActive: {
  },
  statusInactive: {
  },
  exchangeCountry: {
    fontSize: 12,
  },
  // Toggle Button
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButtonActive: {
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Exchange Footer
  exchangeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
  },
  cardDetails: {
    marginTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: typography.caption,
  },
  detailValue: {
    fontSize: typography.caption,
    fontWeight: "400",
  },
  connectedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  connectedBadgeText: {
    fontSize: typography.caption,
    fontWeight: "400",
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  connectButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
  },
  infoBox: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  infoIconYellow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  modalContent: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    height: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "400",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: "300",
  },
  exchangeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalExchangeName: {
    fontSize: 16,
    fontWeight: "400",
  },
  modalExchangeCountry: {
    fontSize: 13,
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
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  inputWithButtons: {
    position: 'relative',
  },
  inputWithIcons: {
    borderRadius: 8,
    padding: 12,
    paddingRight: 96,
    fontSize: 14,
    borderWidth: 1,
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
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "400",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Confirm Modal (centralizado)
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    borderRadius: 20,
    width: "90%",
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "500",
  },
  confirmModalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalCloseIcon: {
    fontSize: 24,
    fontWeight: '300',
  },
  confirmModalBody: {
    padding: 24,
  },
  confirmModalMessage: {
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 20,
  },
  confirmModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 0.5,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonText: {
    fontSize: 15,
    fontWeight: '400',
  },
  // Details Modal Styles
  detailsModalContent: {
    borderRadius: 20,
    width: "90%",
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  detailsModalScroll: {
    maxHeight: 500,
  },
  detailsModalBody: {
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailsExchangeIcon: {
    width: 48,
    height: 48,
  },
  detailsIconText: {
    fontSize: 28,
  },
  detailsHeaderText: {
    flex: 1,
    gap: 8,
  },
  detailsExchangeName: {
    fontSize: 20,
    fontWeight: '600',
  },
  detailsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  detailsStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailsStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  detailsInfoLabel: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  detailsInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1.5,
    textAlign: 'right',
  },
  detailsFeatureBox: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  detailsFeatureText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  detailsSecurityBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailsSecurityText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  detailsModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 0.5,
  },
  detailsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  detailsLoadingText: {
    fontSize: 14,
    fontWeight: '400',
  },
  detailsFeesBox: {
    padding: 12,
    borderRadius: 8,
  },
  detailsFeesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailsFeeLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  detailsFeeValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailsMarketsBox: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  detailsMarketsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsMarketsSample: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  detailsMarketChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  detailsMarketText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsMarketsMore: {
    fontSize: 12,
    fontWeight: '400',
    paddingVertical: 6,
  },
  detailsCapabilitiesBox: {
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  detailsCapabilityRow: {
    paddingVertical: 4,
  },
  detailsCapabilityText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  // Estilos compactos para linked exchanges
  compactCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactIcon: {
    width: '100%',
    height: '100%',
  },
  compactName: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
    flex: 1,
  },
  compactDate: {
    fontSize: typography.caption,
    fontWeight: fontWeights.regular,
    width: 80,
  },
  compactToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  compactToggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuDropdown: {
    position: 'absolute',
    right: 8,
    top: 48,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 140,
  },
  deleteMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    justifyContent: 'center',
  },
  deleteMenuText: {
    fontSize: typography.body,
    fontWeight: fontWeights.medium,
  },
  // Estilos para exchanges disponíveis (compacto)
  availableCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availableIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableIcon: {
    width: '100%',
    height: '100%',
  },
  availableName: {
    fontSize: typography.caption,
    fontWeight: fontWeights.medium,
    flex: 1,
  },
  availableInfo: {
    fontSize: typography.body,
    marginLeft: 4,
  },
  infoIconButton: {
    padding: 4,
    position: 'relative',
  },
  passphraseTooltip: {
    position: 'absolute',
    bottom: -35,
    left: -50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 120,
    zIndex: 9999,
    elevation: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  passphraseTooltipText: {
    fontSize: typography.caption,
    textAlign: 'center',
  },
  connectedBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  connectedBadgeTextCompact: {
    fontSize: typography.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
  },
  connectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  connectBadgeText: {
    fontSize: typography.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
})
