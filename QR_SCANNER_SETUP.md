# 📱 Setup do QR Scanner

## ✅ Implementação Completa

O leitor de QR Code foi totalmente implementado! Agora você tem:

### 🎯 Funcionalidades

1. **Escanear QR Code** 📷
   - Botão azul com ícone de QR em cada campo (API Key, API Secret, Passphrase)
   - Abre a câmera para escanear QR codes
   - Suporta códigos de barras também
   - Interface com bordas e guias visuais

2. **Colar da Área de Transferência** 📋
   - Botão cinza com ícone de clipboard
   - Cola o texto copiado diretamente no campo
   - Notificação de sucesso ao colar

3. **Suporte a JSON**
   - Se o QR code contiver JSON com `apiKey`, `apiSecret` e `passphrase`, preenche todos os campos automaticamente
   - Se for texto simples, preenche apenas o campo selecionado

### 📦 Instalação Necessária

Para ativar o QR Scanner, você precisa instalar as dependências da câmera:

```bash
# Usando npm
npx expo install expo-camera

# OU usando yarn
yarn add expo-camera

# OU usando pnpm
pnpm add expo-camera
```

### 📝 Permissões

O app solicitará automaticamente permissão para acessar a câmera quando você clicar no botão de QR.

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>Precisamos da câmera para escanear QR codes das exchanges</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### 🎨 Interface

#### Botões nos Inputs:
- **Botão Colar (esquerda)**: Ícone de clipboard, fundo cinza
- **Botão QR (direita)**: Ícone de QR code, fundo azul

#### Scanner de QR:
- Tela cheia com câmera ao fundo
- Overlay escuro nas bordas
- Área de scan no centro com bordas azuis
- Instruções no topo
- Botão cancelar na parte inferior
- Dica sobre códigos de barras

### 📂 Arquivos Modificados

1. **components/QRScanner.tsx** ✨ NOVO
   - Componente completo do scanner
   - Gerenciamento de permissões
   - UI com overlay e guias visuais

2. **components/exchanges-manager.tsx** ✏️ ATUALIZADO
   - Botões de QR e Colar em todos os inputs
   - Funções `handleOpenQRScanner` e `handlePasteFromClipboard`
   - Estados para controlar o scanner
   - Parsing de JSON para QR codes estruturados

3. **contexts/LanguageContext.tsx** ✏️ ATUALIZADO
   - Novas traduções:
     - `exchanges.scanQR`: "Escanear QR Code" / "Scan QR Code"
     - `exchanges.pasteFromClipboard`: "Colar da Área de Transferência" / "Paste from Clipboard"

4. **screens/LoginScreen.tsx** ✏️ MELHORADO
   - KeyboardAvoidingView otimizado
   - ScrollView com contentContainerStyle

5. **screens/SignUpScreen.tsx** ✏️ MELHORADO
   - KeyboardAvoidingView otimizado
   - ScrollView com contentContainerStyle

### 🚀 Como Usar

1. Abra o modal de "Conectar Corretora"
2. Em qualquer campo (API Key, Secret, Passphrase), você verá 2 botões:
   - **Clipboard** (cinza): Cola texto da área de transferência
   - **QR Code** (azul): Abre a câmera para escanear

3. **Para escanear:**
   - Clique no botão azul de QR
   - Permita acesso à câmera (primeira vez)
   - Posicione o QR code dentro da área marcada
   - O scanner fecha automaticamente após ler o código

4. **Para colar:**
   - Copie a chave no seu dispositivo
   - Clique no botão cinza de clipboard
   - O texto é colado automaticamente

### 💡 Dicas

- **QR Codes de Exchanges**: Algumas exchanges geram QR codes em formato JSON com todas as credenciais. O scanner detecta e preenche todos os campos!
- **Texto Longo**: Use o botão de colar para chaves muito longas
- **Segurança**: O app não salva ou envia nenhuma imagem da câmera

### 🐛 Troubleshooting

**Erro "Cannot find module 'expo-camera'":**
```bash
npx expo install expo-camera
```

**Câmera não abre:**
- Verifique se você deu permissão para câmera nas configurações do dispositivo
- No iOS: Configurações > CryptoHub > Câmera
- No Android: Configurações > Apps > CryptoHub > Permissões > Câmera

**QR code não é reconhecido:**
- Certifique-se de que o código está nítido e bem iluminado
- Posicione o código dentro da área marcada
- Tente aproximar ou afastar o dispositivo

### 📱 Testando

1. Instale a dependência:
   ```bash
   npx expo install expo-camera
   ```

2. Reinicie o Metro bundler:
   ```bash
   npx expo start --clear
   ```

3. Teste em um dispositivo físico (câmera não funciona no simulador)

---

**Status:** ✅ Implementação completa - Aguardando instalação do expo-camera
