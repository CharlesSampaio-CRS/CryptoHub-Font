# Integração com API Python

Este documento descreve a integração do aplicativo React Native/Next.js com a API Python para gerenciamento de balances de exchanges de criptomoedas.

## 🔗 Configuração da API

A API Python deve estar rodando em: `http://localhost:5000/api/v1`

### Endpoint Utilizado

```bash
GET /api/v1/balances?user_id={userId}
```

**Exemplo:**
```bash
curl --location 'http://localhost:5000/api/v1/balances?user_id=charles_test_user'
```

## 📁 Estrutura de Arquivos

### Tipos TypeScript (`types/api.ts`)
Define as interfaces para a resposta da API:
- `Token`: Representa um token com quantidade, preço e valor em USD
- `Exchange`: Representa uma exchange com seus tokens e total
- `BalanceResponse`: Resposta completa da API com exchanges, meta e summary

### Serviço de API (`services/api.ts`)
Contém a lógica para comunicação com a API:
- `getBalances(userId)`: Busca os balances de um usuário
- `formatUSD(value)`: Formata valores em USD
- `formatTokenAmount(amount)`: Formata quantidades de tokens

### Configuração (`lib/config.ts`)
Armazena configurações globais:
- `userId`: ID do usuário (atualmente: `charles_test_user`)
- `apiBaseUrl`: URL base da API

## 🎯 Componentes Atualizados

### 1. PortfolioOverview
- Exibe o patrimônio total em USD
- Mostra a quantidade de exchanges conectadas
- Atualiza automaticamente ao carregar

### 2. ExchangesList
- Lista todas as exchanges conectadas
- Mostra o saldo de cada exchange
- Exibe a quantidade de tokens por exchange
- Logos personalizados para cada exchange

### 3. TokensList (Novo)
- Componente para exibir detalhes dos tokens de uma exchange
- Mostra quantidade, preço e valor de cada token
- Filtra tokens com saldo zero

## 🚀 Como Usar

### 1. Iniciar a API Python
Certifique-se de que a API Python está rodando em `localhost:5000`

### 2. Configurar o Usuário
Edite o arquivo `lib/config.ts` para alterar o `userId` se necessário:

```typescript
export const config = {
  userId: 'seu_user_id_aqui',
  apiBaseUrl: 'http://localhost:5000/api/v1',
} as const;
```

### 3. Executar o Aplicativo
```bash
npm install --legacy-peer-deps
npm run dev  # Para Next.js
# ou
npm start    # Para React Native/Expo
```

## 📊 Estrutura de Resposta da API

```json
{
  "exchanges": [
    {
      "exchange_id": "693481148b0a41e8b6acb079",
      "name": "NovaDAX",
      "success": true,
      "tokens": {
        "LUNC": {
          "amount": "148349.35",
          "price_usd": "0.0000440220",
          "value_usd": "6.53"
        }
      },
      "total_usd": "6.53"
    }
  ],
  "meta": {
    "from_cache": false
  },
  "summary": {
    "exchanges_count": 3,
    "total_usd": "168.52"
  },
  "timestamp": "2025-12-13T17:33:58.815006",
  "user_id": "charles_test_user"
}
```

## 🔄 Fluxo de Dados

1. Componente monta → `useEffect` dispara
2. Chama `apiService.getBalances(userId)`
3. Fetch para `http://localhost:5000/api/v1/balances?user_id=...`
4. API retorna JSON com dados das exchanges
5. Estado do componente é atualizado
6. UI renderiza os dados reais

## 🎨 Features Implementadas

- ✅ Busca automática de balances ao carregar
- ✅ Loading states com ActivityIndicator
- ✅ Tratamento de erros
- ✅ Formatação de valores em USD
- ✅ Formatação de quantidades de tokens
- ✅ Filtragem de tokens sem saldo
- ✅ Logos personalizados por exchange
- ✅ Configuração centralizada

## 📝 TODO / Melhorias Futuras

- [ ] Implementar pull-to-refresh para atualizar dados
- [ ] Adicionar cache local dos dados
- [ ] Implementar autenticação de usuário
- [ ] Adicionar suporte a múltiplos usuários
- [ ] Mostrar histórico de mudanças de preço (24h, 7d, 30d)
- [ ] Adicionar gráficos de distribuição de portfólio
- [ ] Notificações de mudanças significativas de preço
- [ ] Modo offline com sincronização

## 🐛 Troubleshooting

### Erro: "Erro ao carregar dados"
- Verifique se a API Python está rodando
- Confirme que a URL está correta (`http://localhost:5000`)
- Verifique os logs do console para mais detalhes

### Dados não aparecem
- Verifique se o `user_id` está correto em `lib/config.ts`
- Confirme que o usuário tem exchanges configuradas na API
- Teste o endpoint diretamente com curl

### CORS errors (em ambiente web)
- Configure CORS na API Python para permitir requisições do frontend
- Em desenvolvimento, pode ser necessário usar um proxy
