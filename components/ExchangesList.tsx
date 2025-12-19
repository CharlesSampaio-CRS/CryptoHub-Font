import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native"
import { useState, useCallback, useMemo, memo } from "react"
import { apiService } from "@/services/api"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useBalance } from "@/contexts/BalanceContext"
import { usePrivacy } from "@/contexts/PrivacyContext"
import { SkeletonExchangeItem } from "./SkeletonLoaders"
import { TokenDetailsModal } from "./token-details-modal"
import { config } from "@/lib/config"

// Mapeamento dos nomes das exchanges para os arquivos de imagem
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

interface ExchangesListProps {
  onAddExchange?: () => void
  availableExchangesCount?: number
}

export const ExchangesList = memo(function ExchangesList({ onAddExchange, availableExchangesCount = 0 }: ExchangesListProps) {
  const { colors, isDark } = useTheme()
  const { t } = useLanguage()
  const { data, loading, error } = useBalance()
  const { hideValue } = usePrivacy()
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null)
  const [hideZeroBalanceExchanges, setHideZeroBalanceExchanges] = useState(true) // ✅ Começa ATIVADO (oculta zeradas)
  const [selectedToken, setSelectedToken] = useState<{ exchangeId: string; symbol: string } | null>(null)
  const [tokenModalVisible, setTokenModalVisible] = useState(false)

  // Simplesmente expande/colapsa (tokens já vêm carregados no balances completo)
  const toggleExpandExchange = useCallback((exchangeId: string) => {
    setExpandedExchangeId(prev => prev === exchangeId ? null : exchangeId)
  }, [])

  const toggleZeroBalanceExchanges = useCallback(() => {
    setHideZeroBalanceExchanges(prev => !prev)
  }, [])

  const handleTokenPress = useCallback((exchangeId: string, symbol: string) => {
    setSelectedToken({ exchangeId, symbol })
    setTokenModalVisible(true)
  }, [])

  const handleCloseTokenModal = useCallback(() => {
    setTokenModalVisible(false)
    setTimeout(() => {
      setSelectedToken(null)
    }, 300)
  }, [])

  // Filtrar exchanges - oculta corretoras com saldo $0 se toggle ativado
  const filteredExchanges = useMemo(() => {
    if (!data) {
      return []
    }
    
    if (!data.exchanges || data.exchanges.length === 0) {
      return []
    }
    
    // Filtra corretoras com saldo $0 se toggle ativado
    const filtered = hideZeroBalanceExchanges
      ? data.exchanges.filter(ex => parseFloat(ex.total_usd || '0') > 0)
      : data.exchanges
    return filtered
  }, [data, data?.timestamp, hideZeroBalanceExchanges])

  // Estilos dinâmicos baseados no tema
  const themedStyles = useMemo(() => ({
    card: { backgroundColor: colors.surface, borderColor: colors.border },
    toggle: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    toggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleThumb: { backgroundColor: colors.background },
    tokensContainer: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    tokenSymbolBadge: { backgroundColor: colors.surfaceSecondary, borderColor: colors.primary },
    tokenItem: { borderBottomColor: isDark ? 'rgba(71, 85, 105, 0.3)' : colors.border }, // Borda mais suave no dark mode
    logoContainer: { backgroundColor: '#ffffff', borderColor: colors.border }, // Fundo branco em ambos os modos para os ícones
  }), [colors, isDark])

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        <SkeletonExchangeItem />
        <SkeletonExchangeItem />
        <SkeletonExchangeItem />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error || t('home.noData')}</Text>
      </View>
    )
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('exchanges.title')}</Text>
        {availableExchangesCount > 0 && onAddExchange && (
          <TouchableOpacity style={styles.addButton} onPress={onAddExchange}>
            <Text style={[styles.addButtonText, { color: colors.primary }]}>+ Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Toggle de Filtro */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.toggleRow}
          onPress={toggleZeroBalanceExchanges}
          activeOpacity={0.7}
        >
          <View style={styles.toggleLabelContainer}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
              {t('exchanges.hideZeroExchanges')}
            </Text>
            {hideZeroBalanceExchanges && data && data.exchanges.length > filteredExchanges.length && (
              <Text style={[styles.hiddenCount, { color: colors.textSecondary }]}>
                ({data.exchanges.length - filteredExchanges.length} ocultas)
              </Text>
            )}
          </View>
          <View style={[styles.toggle, themedStyles.toggle, hideZeroBalanceExchanges && [styles.toggleActive, themedStyles.toggleActive]]}>
            <View style={[styles.toggleThumb, themedStyles.toggleThumb, hideZeroBalanceExchanges && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.list} collapsable={false}>
        {filteredExchanges.map((exchange, index) => {
          const allTokens = Object.entries(exchange.tokens || {})
          
          // Log para debug
          if (index === 0) {
            console.log('🔍 ExchangesList - Primeira exchange:', {
              name: exchange.name,
              tokensObject: exchange.tokens ? Object.keys(exchange.tokens).length : 0,
              allTokensArray: allTokens.length,
              token_count: exchange.token_count
            })
          }
          
          // Mostra todos os tokens da corretora
          let tokens = allTokens
          
          // Ordenar tokens por valor (maior para menor)
          tokens = tokens.sort((a, b) => {
            const valueA = parseFloat(a[1].value_usd)
            const valueB = parseFloat(b[1].value_usd)
            return valueB - valueA
          })
          
          // Usar token_count do summary se disponível, caso contrário contar os tokens carregados
          const tokenCount = exchange.token_count !== undefined ? exchange.token_count : tokens.length
          const balance = parseFloat(exchange.total_usd)
          const exchangeNameLower = exchange.name.toLowerCase()
          const logoSource = exchangeLogos[exchangeNameLower]
          const isExpanded = expandedExchangeId === exchange.exchange_id
          
          // Debug log
          if (!logoSource) {
          }

          return (
            <View key={exchange.exchange_id} style={index !== filteredExchanges.length - 1 && styles.cardMargin}>
              <TouchableOpacity
                style={[styles.card, themedStyles.card]}
                activeOpacity={0.7}
                onPress={() => toggleExpandExchange(exchange.exchange_id)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.leftSection}>
                    <View style={[styles.logoContainer, themedStyles.logoContainer]}>
                      {logoSource ? (
                        <Image 
                          source={logoSource} 
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.logoFallback}>💰</Text>
                      )}
                    </View>
                    <View>
                      <Text style={[styles.exchangeName, { color: colors.text }]}>{exchange.name}</Text>
                      <Text style={[styles.assetsCount, { color: colors.textSecondary }]}>
                        {tokenCount} {tokenCount === 1 ? t('exchanges.asset') : t('exchanges.assets')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rightSection}>
                    <Text style={[styles.balance, { color: colors.text }]}>
                      {hideValue(apiService.formatUSD(balance))}
                    </Text>
                    <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.tokensContainer, themedStyles.tokensContainer]}>
                  <Text style={[styles.tokensTitle, { color: colors.textSecondary }]}>{t('exchanges.tokensAvailable')}:</Text>
                  {tokens.length === 0 ? (
                    <Text style={[styles.noTokensText, { color: colors.textSecondary }]}>{t('home.noData')}</Text>
                  ) : (
                    tokens.map(([symbol, token]) => {
                      const amount = parseFloat(token.amount)
                      const priceUSD = parseFloat(token.price_usd)
                      const valueUSD = parseFloat(token.value_usd)

                      return (
                        <TouchableOpacity
                          key={symbol}
                          style={[styles.tokenItem, themedStyles.tokenItem]}
                          onPress={() => handleTokenPress(exchange.exchange_id, symbol)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.tokenLeft}>
                            <View style={[styles.tokenSymbolBadge, themedStyles.tokenSymbolBadge]}>
                              <Text style={[styles.tokenSymbol, { color: colors.primary }]}>{symbol}</Text>
                            </View>
                            <View style={styles.tokenInfo}>
                              <Text style={[styles.tokenValue, { color: colors.text }]}>
                                {hideValue(apiService.formatUSD(valueUSD))}
                              </Text>
                              <Text style={[styles.tokenAmount, { color: colors.textSecondary }]}>
                                {hideValue(apiService.formatTokenAmount(token.amount))}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.tokenRight}>
                            {priceUSD > 0 && (
                              <Text style={[styles.tokenPrice, { color: colors.text }]}>
                                {hideValue(apiService.formatUSD(priceUSD))}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      )
                    })
                  )}
                </View>
              )}
            </View>
          )
        })}
      </View>

      {/* Modal de Detalhes do Token */}
      {selectedToken && (
        <TokenDetailsModal
          visible={tokenModalVisible}
          onClose={handleCloseTokenModal}
          exchangeId={selectedToken.exchangeId}
          symbol={selectedToken.symbol}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "400",
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "400",
  },
  filtersContainer: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 6,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  toggleLabelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: "400",
  },
  hiddenCount: {
    fontSize: 10,
    fontWeight: "400",
    fontStyle: "italic",
  },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: "center",
    borderWidth: 1,
  },
  toggleActive: {
    // Colors from theme
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  toggleThumbActive: {
    transform: [{ translateX: 16 }],
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardMargin: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 4,
    borderWidth: 0.5,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    fontSize: 14,
  },
  exchangeName: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 2,
  },
  assetsCount: {
    fontSize: 12,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: "400",
  },
  changePositive: {
    // Use colors.primary
  },
  changeNegative: {
    // Use colors.danger
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  expandIcon: {
    fontSize: 12,
  },
  tokensContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  tokensTitle: {
    fontSize: 13,
    fontWeight: "400",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noTokensText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
  tokenItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tokenSymbolBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  tokenSymbol: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenAmount: {
    fontSize: 11,
    fontWeight: "300",
  },
  tokenPrice: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tokenValueZero: {
    // Applied via inline style
  },
  tokenRight: {
    alignItems: "flex-end",
  },
  loadingTokens: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  loadingTokensText: {
    fontSize: 13,
    fontWeight: "400",
  },
})
