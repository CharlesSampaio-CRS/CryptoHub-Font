import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useTheme } from "@/contexts/ThemeContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { strategiesService } from "@/services/strategies"
import { apiService } from "@/services/api"
import { LinkedExchange } from "@/types/api"

interface CreateStrategyModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

const TEMPLATES = [
  {
    id: "simple",
    nameKey: "strategy.simple",
    descriptionKey: "strategy.simpleDesc",
    icon: "📊",
  },
  {
    id: "conservative",
    nameKey: "strategy.conservative",
    descriptionKey: "strategy.conservativeDesc",
    icon: "🛡️",
  },
  {
    id: "aggressive",
    nameKey: "strategy.aggressive",
    descriptionKey: "strategy.aggressiveDesc",
    icon: "🚀",
  },
]

export function CreateStrategyModal({ visible, onClose, onSuccess, userId }: CreateStrategyModalProps) {
  const { colors } = useTheme()
  const { t } = useLanguage()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [exchanges, setExchanges] = useState<LinkedExchange[]>([])
  const [loadingExchanges, setLoadingExchanges] = useState(false)
  const [tokens, setTokens] = useState<string[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedExchange, setSelectedExchange] = useState<string>("")
  const [token, setToken] = useState<string>("")
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false)

  useEffect(() => {
    if (visible) {
      loadExchanges()
    } else {
      // Reset form when modal closes
      setStep(1)
      setSelectedTemplate("")
      setSelectedExchange("")
      setToken("")
      setTokens([])
      setShowCustomTokenInput(false)
    }
  }, [visible])

  // Load tokens when reaching step 3
  useEffect(() => {
    if (step === 3 && selectedExchange) {
      setToken("") // Clear token selection when exchange changes
      loadTokens()
    }
  }, [step, selectedExchange])

  const loadExchanges = async () => {
    try {
      setLoadingExchanges(true)
      const response = await apiService.getLinkedExchanges(userId)
      console.log("🏦 Loaded exchanges:", response.exchanges?.length || 0)
      response.exchanges?.forEach(ex => {
        const id = ex.exchange_id || ex._id || "no-id"
        console.log("  - Exchange:", ex.name, "ID:", id)
      })
      setExchanges(response.exchanges || [])
    } catch (error) {
      console.error("Error loading exchanges:", error)
      Alert.alert("Erro", "Não foi possível carregar suas exchanges")
    } finally {
      setLoadingExchanges(false)
    }
  }

  const loadTokens = async () => {
    try {
      setLoadingTokens(true)
      setTokens([])
      
      console.log("🪙 Loading tokens for exchange:", selectedExchange)
      
      // Busca os balances do usuário
      const balanceResponse = await apiService.getBalances(userId)
      
      // Encontra a exchange selecionada nos balances
      const selectedExchangeData = balanceResponse.exchanges.find(ex => {
        // Compara com exchange_id
        return ex.exchange_id === selectedExchange
      })
      
      if (selectedExchangeData && selectedExchangeData.tokens) {
        // Extrai os símbolos dos tokens (chaves do objeto tokens)
        const tokenSymbols = Object.keys(selectedExchangeData.tokens).sort()
        console.log("🪙 Found tokens:", tokenSymbols.length, tokenSymbols)
        setTokens(tokenSymbols)
      } else {
        console.warn("⚠️ No tokens found for exchange:", selectedExchange)
        setTokens([])
      }
    } catch (error) {
      console.error("Error loading tokens:", error)
      Alert.alert("Erro", "Não foi possível carregar os tokens da exchange")
      setTokens([])
    } finally {
      setLoadingTokens(false)
    }
  }

  const handleCreateStrategy = async () => {
    if (!selectedTemplate || !selectedExchange || !token) {
      Alert.alert("Atenção", "Preencha todos os campos")
      return
    }

    try {
      setLoading(true)
      await strategiesService.createStrategy({
        user_id: userId,
        exchange_id: selectedExchange,
        token: token.toUpperCase(),
        template: selectedTemplate as "simple" | "conservative" | "aggressive",
        is_active: true,
      })

      Alert.alert("Sucesso", "Estratégia criada com sucesso!")
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error creating strategy:", error)
      Alert.alert("Erro", error.message || "Não foi possível criar a estratégia")
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = selectedTemplate !== ""
  const canProceedToStep3 = selectedExchange !== ""
  const canCreate = token.trim() !== ""

  const getSelectedExchangeName = () => {
    const exchange = exchanges.find(e => {
      const exchangeId = e.exchange_id || e._id || ""
      return exchangeId === selectedExchange
    })
    console.log("🔍 Looking for exchange:", selectedExchange, "Found:", exchange?.name || "not found")
    return exchange?.name || ""
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>
                Nova Estratégia
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

          {/* Steps Indicator */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  { borderColor: colors.primary },
                  step >= 1 && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: step >= 1 ? "#ffffff" : colors.primary },
                  ]}
                >
                  1
                </Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
                Template
              </Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  { borderColor: step >= 2 ? colors.primary : colors.border },
                  step >= 2 && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: step >= 2 ? "#ffffff" : colors.textSecondary },
                  ]}
                >
                  2
                </Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
                Exchange
              </Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  { borderColor: step >= 3 ? colors.primary : colors.border },
                  step >= 3 && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    { color: step >= 3 ? "#ffffff" : colors.textSecondary },
                  ]}
                >
                  3
                </Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>
                Token
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Step 1: Template Selection */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  Escolha um template
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Selecione uma estratégia pré-configurada
                </Text>

                <View style={styles.templatesList}>
                  {TEMPLATES.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateCard,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        selectedTemplate === template.id && {
                          borderColor: colors.primary,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedTemplate(template.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.templateIcon}>{template.icon}</Text>
                      <Text style={[styles.templateName, { color: colors.text }]}>
                        {t(template.nameKey)}
                      </Text>
                      <Text style={[styles.templateDescription, { color: colors.textSecondary }]}>
                        {t(template.descriptionKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 2: Exchange Selection */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  Selecione a exchange
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Escolha onde a estratégia será executada
                </Text>

                {loadingExchanges ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size={40} color={colors.primary} />
                  </View>
                ) : exchanges.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      Nenhuma exchange conectada
                    </Text>
                    <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                      Conecte uma exchange na aba "Exchanges"
                    </Text>
                  </View>
                ) : (
                  <View style={styles.exchangesList}>
                    {exchanges.map((exchange) => {
                      // Use exchange_id (required field) or fallback to _id
                      const exchangeId = exchange.exchange_id || exchange._id || ""
                      return (
                        <TouchableOpacity
                          key={exchangeId}
                          style={[
                            styles.exchangeCard,
                            { backgroundColor: colors.background, borderColor: colors.border },
                            selectedExchange === exchangeId && {
                              borderColor: colors.primary,
                              borderWidth: 2,
                            },
                          ]}
                          onPress={() => {
                            console.log("🏦 Exchange selected:", exchangeId, exchange.name)
                            setSelectedExchange(exchangeId)
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.exchangeName, { color: colors.text }]}>
                            {exchange.name}
                          </Text>
                          <Text
                            style={[
                              styles.exchangeStatus,
                              {
                                color: "#10b981",
                              },
                            ]}
                          >
                            ● Conectada
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Step 3: Token Selection */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  Selecione o token
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Escolha um token disponível ou digite um customizado
                </Text>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Template:
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {t(TEMPLATES.find(t => t.id === selectedTemplate)?.nameKey || '')}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Exchange:
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {getSelectedExchangeName()}
                    </Text>
                  </View>
                </View>

{loadingTokens ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size={40} color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Carregando tokens...
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Select de tokens */}
                    <View style={styles.selectContainer}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                        Token
                      </Text>
                      <View
                        style={[
                          styles.pickerWrapper,
                          { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <Picker
                          selectedValue={showCustomTokenInput ? "custom" : token}
                          onValueChange={(value) => {
                            if (value === "custom") {
                              setShowCustomTokenInput(true)
                              setToken("")
                            } else {
                              setShowCustomTokenInput(false)
                              setToken(value)
                              console.log("🪙 Token selected:", value)
                            }
                          }}
                          style={[styles.picker, { color: colors.text }]}
                          dropdownIconColor={colors.text}
                        >
                          <Picker.Item label="Selecione um token" value="" />
                          {tokens.map((tokenSymbol) => (
                            <Picker.Item 
                              key={tokenSymbol} 
                              label={tokenSymbol} 
                              value={tokenSymbol} 
                            />
                          ))}
                          <Picker.Item label="✏️ Outro (digitar manualmente)" value="custom" />
                        </Picker>
                      </View>
                    </View>

                    {/* Custom token input (aparece quando seleciona "Outro") */}
                    {showCustomTokenInput && (
                      <View style={styles.customInputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                          Digite o token
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                          ]}
                          placeholder="Ex: BTC, ETH, SOL"
                          placeholderTextColor={colors.textSecondary}
                          value={token}
                          onChangeText={setToken}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          autoFocus
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
                onPress={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Voltar</Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  { backgroundColor: colors.primary },
                  (step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)
                    ? { opacity: 0.5 }
                    : {},
                ]}
                onPress={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}
                disabled={
                  (step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)
                }
              >
                <Text style={styles.buttonTextPrimary}>Próximo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  { backgroundColor: colors.primary },
                  !canCreate || loading ? { opacity: 0.5 } : {},
                ]}
                onPress={handleCreateStrategy}
                disabled={!canCreate || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonTextPrimary}>Criar Estratégia</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
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
  modalContainer: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    height: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "500",
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: "300",
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "300",
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    fontWeight: "300",
    marginBottom: 24,
  },
  templatesList: {
    gap: 12,
    paddingBottom: 12,
  },
  templateCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 4,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    fontWeight: "300",
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    fontWeight: "300",
    textAlign: "center",
  },
  exchangesList: {
    gap: 12,
  },
  exchangeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  exchangeName: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 6,
  },
  exchangeStatus: {
    fontSize: 12,
    fontWeight: "300",
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    marginBottom: 20,
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "300",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: "400",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "300",
    marginTop: 12,
    textAlign: "center",
  },
  selectContainer: {
    gap: 8,
    marginBottom: 16,
  },
  selectWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 180 : 50,
    width: "100%",
  },
  customInputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "300",
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonPrimary: {},
  buttonText: {
    fontSize: 14,
    fontWeight: "400",
  },
  buttonTextPrimary: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
})
