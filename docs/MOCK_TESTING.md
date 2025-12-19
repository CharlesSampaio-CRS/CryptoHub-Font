# 🧪 Modo Mock - Testes Locais

Este guia explica como usar o modo mock para testar o aplicativo sem conexão com a API real.

## 📋 Como Ativar o Modo Mock

### Método 1: Toggle na Tela de Login (Recomendado) ✨

1. **Abra o app**
2. **Na tela de login**, você verá um toggle "🧪 Modo de Teste (Mock)"
3. **Ative o toggle** para usar dados mockados
4. **Faça login normalmente**
5. **Indicador visual**: Uma barra laranja aparecerá no topo de todas as telas mostrando "🧪 MODO TESTE - Dados Simulados"

### Método 2: Editar Configuração Manualmente

Abra o arquivo `lib/config.ts` e use:

```typescript
// Ativar mock
config.setMockMode(true)

// Desativar mock  
config.setMockMode(false)

// Verificar se está ativo
config.isMockMode() // retorna true ou false
```

## 🎨 Indicadores Visuais do Modo Mock

Quando o modo mock está ativo, você verá:

1. **Barra laranja no topo** das telas principais
   - Texto: "🧪 MODO TESTE - Dados Simulados"
   - Cor: Laranja (#FF9500)
   - Sempre visível para lembrar que está usando dados simulados

2. **Toggle na tela de login**
   - Estado desligado: "Conectando à API real"
   - Estado ligado: "Usando dados simulados offline"

## 📊 Dados Disponíveis no Mock (DADOS REAIS DA API)

### Exchanges Conectadas
- **Binance** (ativa) - com BTC, ETH, USDT
- **Bybit** (ativa) - com BTC, SOL
- **KuCoin** (inativa/desconectada)

### Balances
- **Total**: $125,847.32
- **Binance**: $85,420.50
  - BTC: 1.2345 ($52,342.50)
  - ETH: 8.567 ($21,078.00)
  - USDT: 12,000 ($12,000.00)
- **Bybit**: $40,426.82
  - BTC: 0.5678 ($24,076.32)
  - SOL: 85.4 ($16,350.50)

### Tokens Disponíveis
BTC, ETH, USDT, BNB, SOL, ADA, XRP, DOT, DOGE, AVAX, MATIC, LINK, UNI, ATOM, LTC

### Estratégias
- **Estratégia 1**: Binance - BTC (Conservative) - Ativa
- **Estratégia 2**: Binance - ETH (Aggressive) - Ativa
- **Estratégia 3**: Bybit - SOL (Simple) - Inativa

## 🔧 Personalizando os Dados Mock

Os dados mockados estão em `lib/mock-data.ts`. Você pode editar:

### Adicionar nova exchange:
```typescript
export const mockExchanges: LinkedExchange[] = [
  // ... exchanges existentes
  {
    _id: "mock_minha_exchange",
    exchange_id: "mock_minha_exchange",
    ccxt_id: "mexc",
    name: "MEXC",
    icon: "mexc",
    country: "Singapore",
    url: "https://www.mexc.com",
    status: "active",
    is_active: true,
    linked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
```

### Adicionar novo token:
```typescript
export const mockAvailableTokens = [
  // ... tokens existentes
  { symbol: "PEPE", name: "Pepe" },
]
```

### Modificar balances:
```typescript
{
  symbol: "BTC",
  balance: 10.0,  // 👈 Altere aqui
  usd_value: 424000.00,
  price_usd: 42400.00,
  change_24h: 5.5,
}
```

## ⚡ Recursos do Mock

### Delay de Rede Simulado
O mock simula o delay de rede (500ms por padrão):

```typescript
// Para alterar o delay:
export const mockDelay = (ms: number = 1000) => // 1 segundo
  new Promise(resolve => setTimeout(resolve, ms))
```

### Operações CRUD Funcionais
Todas as operações funcionam normalmente:
- ✅ **Criar** estratégia (adiciona ao array em memória)
- ✅ **Editar** estratégia (atualiza no array)
- ✅ **Deletar** estratégia (remove do array)
- ✅ **Listar** balances, exchanges, tokens

### Estado Persistente na Sessão
Os dados modificados persistem enquanto o app estiver rodando. Ao recarregar, volta aos dados originais do mock.

## 🎯 Casos de Uso

### 1. Desenvolvimento Offline
```typescript
// config.ts
useMockData: true
```
Desenvolva sem internet ou sem API rodando.

### 2. Testes de UI
```typescript
// config.ts
useMockData: true
```
Teste layouts e fluxos com dados consistentes.

### 3. Demonstrações
```typescript
// config.ts
useMockData: true
```
Mostre o app funcionando sem depender de APIs externas.

### 4. Produção
```typescript
// config.ts
useMockData: false
```
Use a API real para produção.

## 🔄 Alternando Entre Mock e API Real

### Opção 1: Manual (Recomendado para desenvolvimento)
Edite `lib/config.ts` e altere `useMockData`

### Opção 2: Variável de Ambiente (Futuro)
Podemos implementar:
```typescript
useMockData: process.env.USE_MOCK === 'true'
```

Depois rodar:
```bash
USE_MOCK=true npm start  # Mock
USE_MOCK=false npm start # API real
```

## 📝 Checklist Antes de Commitar

Antes de fazer commit ou deploy, certifique-se:

```typescript
// ✅ lib/config.ts
export const config = {
  useMockData: false,  // ← Deve estar FALSE para produção
}
```

## 🐛 Troubleshooting

### Mudei para mock mas ainda chama API
- ✅ Reinicie o servidor (Ctrl+C e `npm start`)
- ✅ Verifique se salvou `lib/config.ts`
- ✅ Limpe o cache: `rm -rf node_modules/.cache`

### Mock não tem os dados que preciso
- ✅ Edite `lib/mock-data.ts`
- ✅ Adicione seus dados customizados
- ✅ Reinicie o app

### Erro de tipo TypeScript
- ✅ Verifique se os dados mock seguem as interfaces
- ✅ Veja `types/api.ts` para os tipos corretos

## 📚 Arquivos Relacionados

- `lib/config.ts` - Configuração principal (onde ativa/desativa mock)
- `lib/mock-data.ts` - Dados mockados e helpers
- `services/api.ts` - Service que deve usar o mock quando ativado
- `services/strategies.ts` - Service de estratégias
- `types/api.ts` - Interfaces TypeScript

## 💡 Dicas

1. **Use mock durante desenvolvimento** para trabalhar offline
2. **Customize os dados** para testar edge cases
3. **Sempre desative** antes de fazer deploy
4. **Adicione mais dados** conforme necessário

---

**Modo atual**: Para verificar, abra `lib/config.ts` e veja o valor de `useMockData`

- `true` = 🧪 **Modo Mock** (offline, dados falsos)
- `false` = 🌐 **Modo Produção** (API real)
