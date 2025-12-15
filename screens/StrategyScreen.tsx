import { Text, StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Modal, Pressable, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useTheme } from "../contexts/ThemeContext"
import { useLanguage } from "../contexts/LanguageContext"
import { strategiesService, type Strategy as APIStrategy, type Execution } from "../services/strategies"
import { CreateStrategyModal } from "../components/create-strategy-modal"

interface Strategy {
  id: string
  name: string
  type: string
  exchange: string
  token: string
  isActive: boolean
  conditions: string
  createdAt: Date
  stats?: {
    totalExecutions: number
    totalBuys: number
    totalSells: number
    lastExecutionAt: Date | null
    totalPnlUsd: number
    winRate: number
  }
}

const USER_ID = "charles_test_user"

export function StrategyScreen() {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<"strategies" | "executions">("strategies")
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)

  const [executions, setExecutions] = useState<Execution[]>([])

  // Modal de confirmação de exclusão
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false)
  const [confirmStrategyId, setConfirmStrategyId] = useState<string>("")
  const [confirmStrategyName, setConfirmStrategyName] = useState<string>("")

  // Modal de confirmação de toggle (ativar/desativar)
  const [confirmToggleModalVisible, setConfirmToggleModalVisible] = useState(false)
  const [toggleStrategyId, setToggleStrategyId] = useState<string>("")
  const [toggleStrategyName, setToggleStrategyName] = useState<string>("")
  const [toggleStrategyNewStatus, setToggleStrategyNewStatus] = useState<boolean>(false)

  // Load strategies and executions from API
  useEffect(() => {
    loadStrategies()
    loadExecutions()
  }, [])

  const loadStrategies = async (skipStats: boolean = false) => {
    try {
      setLoading(true)
      const apiStrategies = await strategiesService.getUserStrategies(USER_ID)
      
      console.log("📊 Loaded strategies from API:", apiStrategies.length)
      
      // Transform API data to local format - Filter out invalid strategies
      const validStrategies = apiStrategies.filter(apiStrategy => {
        const strategyId = apiStrategy._id || apiStrategy.id
        if (!strategyId) {
          console.warn("⚠️ Strategy without _id or id:", apiStrategy)
          return false
        }
        console.log("✅ Valid strategy ID:", strategyId, "Token:", apiStrategy.token)
        return true
      })

      // Load stats in parallel with Promise.allSettled to not block on failures
      // Pula busca de stats se for logo após criar estratégia (não terá dados ainda)
      let statsResults: PromiseSettledResult<any>[] = []
      
      if (!skipStats) {
        const statsPromises = validStrategies.map(apiStrategy => {
          const strategyId = apiStrategy._id || apiStrategy.id || ""
          return strategiesService.getStrategyStats(strategyId, USER_ID)
        })
        statsResults = await Promise.allSettled(statsPromises)
      }

      // Transform with preloaded stats
      const transformedStrategies: Strategy[] = validStrategies.map((apiStrategy, index) => {
        const display = strategiesService.formatStrategyDisplay(apiStrategy)
        const strategyId = apiStrategy._id || apiStrategy.id || ""
        
        // Get stats from parallel load result
        let stats = undefined
        
        // Se não pulou stats, processa o resultado
        if (!skipStats && statsResults[index]) {
          const statsResult = statsResults[index]
          
          if (statsResult.status === 'fulfilled') {
            const statsResponse = statsResult.value
            stats = {
              totalExecutions: statsResponse.stats.total_executions,
              totalBuys: statsResponse.stats.total_buys,
              totalSells: statsResponse.stats.total_sells,
              lastExecutionAt: statsResponse.stats.last_execution_at 
                ? new Date(statsResponse.stats.last_execution_at) 
                : null,
              totalPnlUsd: statsResponse.stats.total_pnl_usd,
              winRate: statsResponse.stats.win_rate,
            }
          } else {
            // Apenas loga warning se não for erro 404 (estratégia nova)
            const errorMsg = statsResult.reason?.message || ''
            const is404 = errorMsg.includes('404') || errorMsg.includes('Not Found')
            
            if (!is404) {
              console.warn(`⚠️ Failed to load stats for strategy ${strategyId} (${apiStrategy.token}):`, statsResult.reason?.message || statsResult.reason)
            }
            // Stats ficam undefined para estratégias novas
          }
        }
        
        return {
          id: strategyId,
          name: display.name,
          type: display.type,
          exchange: apiStrategy.exchange_name || "Unknown",
          token: apiStrategy.token,
          isActive: apiStrategy.is_active,
          conditions: display.conditions,
          createdAt: new Date(apiStrategy.created_at),
          stats,
        }
      })
      
      setStrategies(transformedStrategies)
    } catch (error) {
      console.error("Error loading strategies:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadExecutions = async () => {
    try {
      console.log("🔄 Loading executions from API...")
      const apiExecutions = await strategiesService.getUserExecutions(USER_ID)
      console.log("📊 Loaded executions:", apiExecutions.length)
      setExecutions(apiExecutions)
    } catch (error) {
      console.error("Error loading executions:", error)
      setExecutions([])
    }
  }

  const toggleStrategy = useCallback((id: string) => {
    const strategyToToggle = strategies.find(s => s.id === id)
    if (!strategyToToggle) return

    const newIsActive = !strategyToToggle.isActive
    
    // Show confirmation modal
    setToggleStrategyId(id)
    setToggleStrategyName(strategyToToggle.name)
    setToggleStrategyNewStatus(newIsActive)
    setConfirmToggleModalVisible(true)
  }, [strategies])

  const confirmToggle = useCallback(async () => {
    const id = toggleStrategyId
    const newIsActive = toggleStrategyNewStatus
    
    setConfirmToggleModalVisible(false)
    setToggleStrategyId("")
    setToggleStrategyName("")
    setToggleStrategyNewStatus(false)

    // Optimistic update
    const previousStrategies = [...strategies]

    setStrategies(prev =>
      prev.map(strategy =>
        strategy.id === id
          ? { ...strategy, isActive: newIsActive }
          : strategy
      )
    )

    // Update on server
    try {
      await strategiesService.updateStrategy(id, { is_active: newIsActive })
      console.log(`✅ Strategy ${id} toggled to ${newIsActive}`)
    } catch (error) {
      console.error("Error toggling strategy:", error)
      // Rollback on error
      setStrategies(previousStrategies)
      alert(`Erro ao alterar estratégia: ${error instanceof Error ? error.message : error}`)
    }
  }, [toggleStrategyId, toggleStrategyNewStatus, strategies])

  const deleteStrategy = useCallback(async (id: string, name: string) => {
    setConfirmStrategyId(id)
    setConfirmStrategyName(name)
    setConfirmDeleteModalVisible(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    const id = confirmStrategyId
    const name = confirmStrategyName
    
    setConfirmDeleteModalVisible(false)
    setConfirmStrategyId("")
    setConfirmStrategyName("")

    try {
      console.log("🔄 Deleting strategy:", id)
      
      // Optimistic update - remove from UI immediately
      setStrategies(prev => prev.filter(s => s.id !== id))
      
      // Call API with user_id parameter
      await strategiesService.deleteStrategy(id, USER_ID)
      
      console.log(`✅ Strategy "${name}" deleted successfully`)
    } catch (error: any) {
      console.error("Error deleting strategy:", error)
      
      // Rollback - reload strategies on error
      loadStrategies()
      
      alert(`Erro ao deletar estratégia: ${error.message || error}`)
    }
  }, [confirmStrategyId, confirmStrategyName, loadStrategies])

  const handleNewStrategy = useCallback(() => {
    setCreateModalVisible(true)
  }, [])

  const handleStrategyCreated = useCallback(async () => {
    setCreateModalVisible(false)
    try {
      // Recarrega estratégias sem buscar stats (estratégia nova não terá execuções)
      // Recarrega execuções também (que será vazio para estratégia nova)
      await Promise.all([
        loadStrategies(true), // skipStats = true
        loadExecutions()
      ])
    } catch (error) {
      console.error("Error reloading data after strategy creation:", error)
      // Não mostra erro para o usuário pois a estratégia já foi criada com sucesso
    }
  }, [loadStrategies, loadExecutions])

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }, [])

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }, [])

  // Memoize computed values to avoid recalculation on every render
  const strategiesCount = useMemo(() => strategies.length, [strategies.length])
  const executionsCount = useMemo(() => executions.length, [executions.length])
  const hasStrategies = useMemo(() => strategiesCount > 0, [strategiesCount])
  const hasExecutions = useMemo(() => executionsCount > 0, [executionsCount])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('strategy.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {activeTab === "strategies"
              ? `${strategiesCount} ${strategiesCount === 1 ? t('strategy.strategy') : t('strategy.strategies')}`
              : `${executionsCount} ${executionsCount === 1 ? t('strategy.execution') : t('strategy.executions')}`
            }
          </Text>
        </View>
        
        {activeTab === "strategies" && hasStrategies && (
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: colors.primary }]}
            onPress={handleNewStrategy}
            activeOpacity={0.8}
          >
            <Text style={styles.newButtonText}>{t('strategy.new')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === "strategies" && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setActiveTab("strategies")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.text },
              activeTab === "strategies" && { color: "#ffffff" },
            ]}
          >
            {t('strategy.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            { borderColor: colors.border },
            activeTab === "executions" && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setActiveTab("executions")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.text },
              activeTab === "executions" && { color: "#ffffff" },
            ]}
          >
            {t('strategy.executions')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadStrategies()
              loadExecutions()
            }}
            tintColor={colors.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size={40} color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : activeTab === "strategies" ? (
          strategies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('strategy.empty')}</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                {t('strategy.emptyDesc')}
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleNewStrategy}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>{t('strategy.new')}</Text>
              </TouchableOpacity>
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
                  
                  {strategy.conditions && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Condições
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {strategy.conditions}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Stats Section */}
                {strategy.stats && (
                  <View style={[styles.statsSection, { borderTopColor: colors.border }]}>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          {t('strategy.executions')}
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {strategy.stats.totalExecutions}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Compras
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {strategy.stats.totalBuys}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Vendas
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {strategy.stats.totalSells}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          PnL Total
                        </Text>
                        <Text
                          style={[
                            styles.statValue,
                            {
                              color:
                                strategy.stats.totalPnlUsd > 0
                                  ? "#10b981"
                                  : strategy.stats.totalPnlUsd < 0
                                  ? "#ef4444"
                                  : colors.text,
                            },
                          ]}
                        >
                          {formatCurrency(strategy.stats.totalPnlUsd)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Win Rate
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                          {strategy.stats.winRate.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Última
                        </Text>
                        <Text style={[styles.statValue, { color: colors.text, fontSize: 11 }]}>
                          {strategy.stats.lastExecutionAt
                            ? formatDate(strategy.stats.lastExecutionAt)
                            : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Footer with Status and Delete */}
                <View style={[styles.strategyFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: strategy.isActive ? "#10b981" : "#6b7280" },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                      {strategy.isActive ? t('strategy.active') : t('strategy.inactive')}
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
          )
        ) : (
          executions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma execução</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                As ordens executadas aparecerão aqui
              </Text>
            </View>
          ) : (
            <View style={styles.executionsList}>
              {executions.map((execution) => (
                <View
                  key={execution.id}
                  style={[styles.executionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.executionHeader}>
                    <View style={styles.executionHeaderLeft}>
                      <Text style={[styles.executionName, { color: colors.text }]}>
                        {execution.strategyName}
                      </Text>
                      <View
                        style={[
                          styles.executionTypeBadge,
                          {
                            backgroundColor:
                              execution.type === "buy"
                                ? "#10b98110"
                                : "#ef444410",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.executionTypeText,
                            {
                              color:
                                execution.type === "buy" ? "#10b981" : "#ef4444",
                            },
                          ]}
                        >
                          {execution.type === "buy" ? "Compra" : "Venda"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.executionDate, { color: colors.textSecondary }]}>
                      {formatDate(execution.executedAt)}
                    </Text>
                  </View>

                  <View style={styles.executionInfo}>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Exchange
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {execution.exchange}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Token
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {execution.token}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Quantidade
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {execution.amount.toFixed(8)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Preço
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {formatCurrency(execution.price)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        Total
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text, fontWeight: "600" }]}>
                        {formatCurrency(execution.total)}
                      </Text>
                    </View>
                    {execution.message && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                          Motivo
                        </Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {execution.message}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      {/* Toggle Confirmation Modal */}
      <Modal
        visible={confirmToggleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmToggleModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setConfirmToggleModalVisible(false)}
        >
          <Pressable
            style={[styles.confirmModal, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              {toggleStrategyNewStatus ? t('strategy.activateConfirm') : t('strategy.deactivateConfirm')}
            </Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              {t('strategy.statusWillChange')}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setConfirmToggleModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: toggleStrategyNewStatus ? "#10b981" : "#6b7280" }]}
                onPress={confirmToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteConfirmButtonText}>
                  {t('common.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={confirmDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setConfirmDeleteModalVisible(false)}
        >
          <Pressable
            style={[styles.confirmModal, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              {t('strategy.confirmDelete')}
            </Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              {t('strategy.deleteWarning')}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setConfirmDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteConfirmButtonText}>{t('strategy.delete')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Strategy Modal */}
      <CreateStrategyModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={handleStrategyCreated}
        userId={USER_ID}
      />
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
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  // Tabs
  tabsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Create Button
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Stats
  statsSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "400",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Executions
  executionsList: {
    gap: 16,
  },
  executionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  executionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  executionHeaderLeft: {
    flex: 1,
    gap: 8,
  },
  executionName: {
    fontSize: 14,
    fontWeight: "600",
  },
  executionTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  executionTypeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  executionDate: {
    fontSize: 12,
    fontWeight: "400",
  },
  executionInfo: {
    gap: 8,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModal: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteConfirmButton: {
    backgroundColor: "#ef4444",
  },
  deleteConfirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
})
