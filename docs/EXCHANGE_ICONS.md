# 🎨 Ícones das Exchanges

## 📁 Localização dos Ícones

Os ícones das exchanges estão localizados em:
```
/assets/
├── binance.png
├── bybit.png
├── coinbase.jpeg
├── gateio.png
├── kraken.png
├── kucoin.png
├── mexc.png
├── novadax.png
└── okx.png
```

## ✅ Exchanges Configuradas

| Exchange | Arquivo | Formato | Status |
|----------|---------|---------|--------|
| Binance | `binance.png` | PNG | ✅ |
| NovaDAX | `novadax.png` | PNG | ✅ |
| MEXC | `mexc.png` | PNG | ✅ |
| Coinbase | `coinbase.jpeg` | JPEG | ✅ |
| Kraken | `kraken.png` | PNG | ✅ |
| Bybit | `bybit.png` | PNG | ✅ |
| Gate.io | `gateio.png` | PNG | ✅ |
| KuCoin | `kucoin.png` | PNG | ✅ |
| OKX | `okx.png` | PNG | ✅ |

## 🔧 Implementação

### Mapeamento no Código

Arquivo: `components/ExchangesList.tsx`

```typescript
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
```

### Renderização

```typescript
{logoSource ? (
  <Image 
    source={logoSource} 
    style={styles.logoImage}
    resizeMode="contain"
  />
) : (
  <Text style={styles.logoFallback}>💰</Text>
)}
```

### Estilos

```typescript
logoContainer: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#ffffff",  // Fundo branco para os logos
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",           // Para manter bordas arredondadas
},
logoImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
},
logoFallback: {
  fontSize: 20,                  // Emoji fallback se não houver logo
},
```

## ➕ Como Adicionar Nova Exchange

### 1. Adicionar o Ícone

Coloque o arquivo na pasta `/assets/`:
```bash
# Exemplo: adicionar Bitfinex
/assets/bitfinex.png
```

**Recomendações:**
- Formato: PNG ou JPEG
- Tamanho: 200x200px ou maior
- Fundo: Transparente (PNG) ou branco
- Qualidade: Alta resolução

### 2. Atualizar o Mapeamento

Edite `components/ExchangesList.tsx`:

```typescript
const exchangeLogos: Record<string, any> = {
  // ... exchanges existentes
  "Bitfinex": require("@/assets/bitfinex.png"),  // ← Adicionar aqui
}
```

**⚠️ IMPORTANTE:** O nome deve corresponder **exatamente** ao nome retornado pela API!

### 3. Atualizar Versão Animada (Opcional)

Se estiver usando a versão animada, edite também `components/exchanges-list-animated.tsx`:

```typescript
const exchangeLogos: Record<string, any> = {
  // ... exchanges existentes
  "Bitfinex": require("@/assets/bitfinex.png"),
}
```

### 4. Testar

```bash
# Limpar cache e reiniciar
npm start -- --reset-cache
```

## 🎨 Especificações dos Ícones

### Tamanho Recomendado
- **Mínimo:** 200x200px
- **Ideal:** 512x512px
- **Máximo:** 1024x1024px

### Formato
- **Preferencial:** PNG com transparência
- **Alternativo:** JPEG com fundo branco

### Design
- Logo centralizado
- Margens adequadas (padding ~10%)
- Sem texto adicional (apenas símbolo)
- Alta resolução

### Cores
- Manter cores originais da marca
- Contraste suficiente com fundo branco

## 🔄 Fallback

Se uma exchange não tiver logo configurado, será exibido o emoji 💰:

```typescript
const logoSource = exchangeLogos[exchange.name]

// Se não encontrar, usa fallback
{logoSource ? (
  <Image source={logoSource} />
) : (
  <Text>💰</Text>
)}
```

## 📊 Exemplos de Nomes da API

Certifique-se de que o nome no código corresponde ao da API:

```json
{
  "exchanges": [
    {"name": "Binance"},     // ← "Binance" no código
    {"name": "NovaDAX"},     // ← "NovaDAX" no código
    {"name": "MEXC"},        // ← "MEXC" no código
    {"name": "Coinbase"},    // ← "Coinbase" no código
    {"name": "Gate.io"},     // ← "Gate.io" no código (com ponto)
  ]
}
```

## 🎨 Visual Atualizado

### Antes (Emojis)
```
🔶 Binance         $68,420.50
🔵 Coinbase        $42,180.22
🟣 Kraken          $31,979.70
```

### Depois (Logos Reais)
```
[Logo] Binance     $68,420.50
[Logo] Coinbase    $42,180.22
[Logo] Kraken      $31,979.70
```

## 🚀 Otimizações

### Compressão de Imagens

Para melhorar performance, comprima os ícones:

```bash
# Usando ImageOptim (Mac)
# ou TinyPNG (Web)
# ou pngquant (CLI)

pngquant --quality=85-95 binance.png
```

### Lazy Loading (Futuro)

Para muitas exchanges, considere lazy loading:

```typescript
import { Image } from 'react-native'

// Ao invés de require, use uri
const logoSource = { uri: `https://cdn.example.com/logos/${exchange.name}.png` }
```

## 📝 Checklist para Nova Exchange

- [ ] Ícone adicionado em `/assets/`
- [ ] Nome do arquivo em lowercase
- [ ] Formato PNG ou JPEG
- [ ] Tamanho adequado (200x200 mínimo)
- [ ] Mapeamento atualizado em `ExchangesList.tsx`
- [ ] Mapeamento atualizado em `exchanges-list-animated.tsx` (se usado)
- [ ] Nome corresponde exatamente ao da API
- [ ] Testado em modo desenvolvimento
- [ ] Cache limpo antes de testar

## 🎯 Resultado Final

Agora as exchanges aparecem com seus **logos oficiais** ao invés de emojis! 🎨

Isso torna a interface muito mais **profissional** e **reconhecível**.
