# 🚀 Guia Rápido de Uso da API

## Exemplo de Uso nos Componentes

### Buscar Balances

```typescript
import { useEffect, useState } from "react"
import { apiService } from "@/services/api"
import { BalanceResponse } from "@/types/api"
import { config } from "@/lib/config"

function MeuComponente() {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiService.getBalances(config.userId)
        setData(response)
      } catch (error) {
        console.error("Erro:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (loading) return <Text>Carregando...</Text>
  if (!data) return <Text>Sem dados</Text>

  return (
    <View>
      <Text>Total: {apiService.formatUSD(data.summary.total_usd)}</Text>
      <Text>Exchanges: {data.summary.exchanges_count}</Text>
    </View>
  )
}
```

### Acessar Tokens de uma Exchange

```typescript
// Pegar a primeira exchange
const exchange = data.exchanges[0]

// Listar todos os tokens
Object.entries(exchange.tokens).map(([symbol, token]) => (
  <View key={symbol}>
    <Text>{symbol}: {token.amount}</Text>
    <Text>Valor: {apiService.formatUSD(token.value_usd)}</Text>
  </View>
))
```

### Filtrar Exchanges por Nome

```typescript
const novadax = data.exchanges.find(ex => ex.name === "NovaDAX")
if (novadax) {
  console.log("NovaDAX balance:", novadax.total_usd)
}
```

### Calcular Total de Tokens Específicos

```typescript
// Somar USDT de todas as exchanges
const totalUSDT = data.exchanges.reduce((sum, exchange) => {
  const usdt = exchange.tokens["USDT"]
  if (usdt) {
    return sum + parseFloat(usdt.value_usd)
  }
  return sum
}, 0)

console.log("Total USDT:", apiService.formatUSD(totalUSDT))
```

## Estrutura dos Dados

### BalanceResponse
```typescript
{
  exchanges: Exchange[]       // Lista de exchanges
  meta: {
    from_cache: boolean      // Se veio do cache
  }
  summary: {
    exchanges_count: number  // Quantidade de exchanges
    total_usd: string       // Total em USD
  }
  timestamp: string         // Data/hora da consulta
  user_id: string          // ID do usuário
}
```

### Exchange
```typescript
{
  exchange_id: string      // ID único da exchange
  name: string            // Nome (Binance, MEXC, etc)
  success: boolean        // Se a consulta foi bem sucedida
  tokens: {               // Objeto com tokens
    [symbol]: Token
  }
  total_usd: string      // Total da exchange em USD
}
```

### Token
```typescript
{
  amount: string         // Quantidade do token
  price_usd: string     // Preço unitário em USD
  value_usd: string    // Valor total em USD
}
```

## Helpers de Formatação

```typescript
// Formatar valores USD
apiService.formatUSD(168.52)        // "$168.52"
apiService.formatUSD("168.52")      // "$168.52"

// Formatar quantidade de tokens
apiService.formatTokenAmount("0.0000440220")  // "4.40e-5"
apiService.formatTokenAmount("148349.35")     // "148,349.35"
```

## Atualizar Dados Manualmente

```typescript
const [refreshing, setRefreshing] = useState(false)

const onRefresh = async () => {
  setRefreshing(true)
  try {
    const response = await apiService.getBalances(config.userId)
    setData(response)
  } catch (error) {
    console.error(error)
  } finally {
    setRefreshing(false)
  }
}

// Usar em ScrollView ou FlatList
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {/* Conteúdo */}
</ScrollView>
```

## Trocar de Usuário

```typescript
// Editar lib/config.ts
export const config = {
  userId: 'novo_usuario_id',
  apiBaseUrl: 'http://localhost:5000/api/v1',
} as const;

// Ou criar função dinâmica
async function getBalancesForUser(userId: string) {
  return await apiService.getBalances(userId)
}
```

## Verificar se Exchange tem Saldo

```typescript
function hasBalance(exchange: Exchange): boolean {
  return parseFloat(exchange.total_usd) > 0
}

const exchangesWithBalance = data.exchanges.filter(hasBalance)
```

## Obter Top Tokens por Valor

```typescript
function getTopTokens(exchange: Exchange, limit = 5) {
  return Object.entries(exchange.tokens)
    .map(([symbol, token]) => ({
      symbol,
      ...token,
      valueNum: parseFloat(token.value_usd)
    }))
    .sort((a, b) => b.valueNum - a.valueNum)
    .slice(0, limit)
}

const topTokens = getTopTokens(exchange)
```
