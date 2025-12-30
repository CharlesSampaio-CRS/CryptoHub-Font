#!/bin/bash

# ============================================
# 🚀 Script para Iniciar Todos os Serviços Localmente
# ============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Diretórios dos projetos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/automatic"
AUTH_DIR="$(dirname "$SCRIPT_DIR")/kong-security-api"

# Arquivos de PID
PID_DIR="$SCRIPT_DIR/.pids"
AUTH_PID="$PID_DIR/auth.pid"
BACKEND_PID="$PID_DIR/backend.pid"
FRONTEND_PID="$PID_DIR/frontend.pid"

# Logs
LOG_DIR="$SCRIPT_DIR/.logs"
AUTH_LOG="$LOG_DIR/auth.log"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

# Funções auxiliares
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_service() {
    echo -e "${CYAN}▶ $1${NC}"
}

# Cria diretórios necessários
setup_dirs() {
    mkdir -p "$PID_DIR"
    mkdir -p "$LOG_DIR"
}

# Verifica se um serviço está rodando
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Para processos que estão usando uma porta específica
kill_port() {
    local port=$1
    local port_name=$2
    
    print_info "Verificando porta $port ($port_name)..."
    
    # Encontra o PID usando a porta
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pid" ]; then
        print_info "Porta $port em uso pelo processo $pid. Finalizando..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
        print_success "Processo na porta $port finalizado"
    else
        print_success "Porta $port está livre"
    fi
}

# Para todas as portas necessárias
free_all_ports() {
    print_header "LIBERANDO PORTAS"
    
    kill_port 8080 "Auth API"
    kill_port 5000 "Backend API"
    kill_port 3000 "Frontend Web"
    kill_port 8081 "Frontend Expo"
    
    echo ""
}

# Para um serviço
stop_service() {
    local name=$1
    local pid_file=$2
    
    if is_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        print_info "Parando $name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        sleep 1
        
        # Force kill se necessário
        if ps -p "$pid" > /dev/null 2>&1; then
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$pid_file"
        print_success "$name parado"
    else
        print_info "$name já estava parado"
    fi
}

# Inicia Auth API (Rust)
start_auth() {
    print_service "Iniciando Auth API (Kong Security - Rust)..."
    
    if is_running "$AUTH_PID"; then
        print_info "Auth API já está rodando (PID: $(cat "$AUTH_PID"))"
        return
    fi
    
    if [ ! -d "$AUTH_DIR" ]; then
        print_error "Diretório não encontrado: $AUTH_DIR"
        return 1
    fi
    
    cd "$AUTH_DIR"
    
    # Verifica se .env existe
    if [ ! -f ".env" ]; then
        print_error "Arquivo .env não encontrado em $AUTH_DIR"
        print_info "O Auth API precisa de variáveis de ambiente configuradas"
        print_info "Crie o arquivo .env com as configurações necessárias"
        return 1
    fi
    
    # Carrega variáveis de ambiente de forma segura (ignora linhas vazias e comentários)
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    
    # Verifica se está compilado
    if [ ! -f "target/release/kong-security-api" ]; then
        print_info "Compilando projeto Rust (pode demorar na primeira vez)..."
        cargo build --release > "$AUTH_LOG" 2>&1
    fi
    
    # Inicia o serviço
    print_info "Iniciando na porta 8080..."
    nohup ./target/release/kong-security-api > "$AUTH_LOG" 2>&1 &
    echo $! > "$AUTH_PID"
    
    sleep 2
    
    if is_running "$AUTH_PID"; then
        print_success "Auth API iniciada (PID: $(cat "$AUTH_PID"))"
        print_info "URL: http://localhost:8080"
        print_info "Log: $AUTH_LOG"
    else
        print_error "Falha ao iniciar Auth API"
        print_error "Veja o log: tail -f $AUTH_LOG"
    fi
}

# Inicia Backend API (Python/Flask)
start_backend() {
    print_service "Iniciando Backend API (Automatic - Python/Flask)..."
    
    if is_running "$BACKEND_PID"; then
        print_info "Backend API já está rodando (PID: $(cat "$BACKEND_PID"))"
        return
    fi
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Diretório não encontrado: $BACKEND_DIR"
        return 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Verifica se .env existe
    if [ ! -f ".env" ]; then
        print_error "Arquivo .env não encontrado em $BACKEND_DIR"
        print_info "Crie o arquivo .env com as variáveis necessárias"
    fi
    
    # Verifica se venv existe, se não cria
    if [ ! -d "venv" ]; then
        print_info "Criando ambiente virtual Python..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi
    
    # Inicia o serviço
    print_info "Iniciando na porta 5000..."
    export FLASK_APP=wsgi.py
    export FLASK_ENV=development
    nohup python wsgi.py > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID"
    
    sleep 2
    
    if is_running "$BACKEND_PID"; then
        print_success "Backend API iniciada (PID: $(cat "$BACKEND_PID"))"
        print_info "URL: http://localhost:5000"
        print_info "Log: $BACKEND_LOG"
    else
        print_error "Falha ao iniciar Backend API"
        print_error "Veja o log: tail -f $BACKEND_LOG"
    fi
}

# Inicia Frontend (Next.js/React)
start_frontend() {
    print_service "Iniciando Frontend (Crypto Exchange - Next.js/React)..."
    
    if is_running "$FRONTEND_PID"; then
        print_info "Frontend já está rodando (PID: $(cat "$FRONTEND_PID"))"
        return
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Diretório não encontrado: $FRONTEND_DIR"
        return 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Detecta o gerenciador de pacotes disponível
    local PKG_MANAGER=""
    local PKG_CMD=""
    
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
        PKG_CMD="pnpm web"
    elif command -v yarn &> /dev/null; then
        PKG_MANAGER="yarn"
        PKG_CMD="yarn web"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
        PKG_CMD="npm run web"
    else
        print_error "Nenhum gerenciador de pacotes encontrado (npm, yarn ou pnpm)"
        print_info "Instale o Node.js: https://nodejs.org/"
        return 1
    fi
    
    print_info "Usando $PKG_MANAGER como gerenciador de pacotes"
    
    # Verifica se node_modules existe
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependências com $PKG_MANAGER..."
        $PKG_MANAGER install
    fi
    
    # Inicia o serviço
    print_info "Iniciando nas portas 3000 (web) e 8081 (expo)..."
    nohup $PKG_CMD > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID"
    
    sleep 3
    
    if is_running "$FRONTEND_PID"; then
        print_success "Frontend iniciado (PID: $(cat "$FRONTEND_PID"))"
        print_info "URL Web: http://localhost:3000"
        print_info "URL Expo: http://localhost:8081"
        print_info "Log: $FRONTEND_LOG"
    else
        print_error "Falha ao iniciar Frontend"
        print_error "Veja o log: tail -f $FRONTEND_LOG"
    fi
}

# Inicia todos os serviços
start_all() {
    print_header "INICIANDO TODOS OS SERVIÇOS"
    setup_dirs
    
    # Primeiro libera todas as portas necessárias
    free_all_ports
    
    start_auth
    echo ""
    start_backend
    echo ""
    start_frontend
    echo ""
    
    show_status
}

# Para todos os serviços
stop_all() {
    print_header "PARANDO TODOS OS SERVIÇOS"
    
    stop_service "Auth API" "$AUTH_PID"
    stop_service "Backend API" "$BACKEND_PID"
    stop_service "Frontend" "$FRONTEND_PID"
    
    print_success "Todos os serviços foram parados!"
}

# Reinicia todos os serviços
restart_all() {
    print_header "REINICIANDO TODOS OS SERVIÇOS"
    stop_all
    echo ""
    sleep 2
    start_all
}

# Mostra status dos serviços
show_status() {
    print_header "STATUS DOS SERVIÇOS"
    
    echo -e "\n${CYAN}Auth API (Kong Security - Rust):${NC}"
    if is_running "$AUTH_PID"; then
        echo -e "  ${GREEN}● RODANDO${NC} (PID: $(cat "$AUTH_PID"))"
        echo -e "  ${BLUE}→${NC} http://localhost:8080"
    else
        echo -e "  ${RED}○ PARADO${NC}"
    fi
    
    echo -e "\n${CYAN}Backend API (Automatic - Python):${NC}"
    if is_running "$BACKEND_PID"; then
        echo -e "  ${GREEN}● RODANDO${NC} (PID: $(cat "$BACKEND_PID"))"
        echo -e "  ${BLUE}→${NC} http://localhost:5000"
    else
        echo -e "  ${RED}○ PARADO${NC}"
    fi
    
    echo -e "\n${CYAN}Frontend (Crypto Exchange - Next.js):${NC}"
    if is_running "$FRONTEND_PID"; then
        echo -e "  ${GREEN}● RODANDO${NC} (PID: $(cat "$FRONTEND_PID"))"
        echo -e "  ${BLUE}→${NC} http://localhost:3000 (web)"
        echo -e "  ${BLUE}→${NC} http://localhost:8081 (expo)"
    else
        echo -e "  ${RED}○ PARADO${NC}"
    fi
    
    echo ""
}

# Mostra logs
show_logs() {
    local service=$1
    
    print_header "LOGS DOS SERVIÇOS"
    
    case "$service" in
        auth)
            tail -f "$AUTH_LOG"
            ;;
        backend)
            tail -f "$BACKEND_LOG"
            ;;
        frontend)
            tail -f "$FRONTEND_LOG"
            ;;
        *)
            print_info "Mostrando todos os logs (Ctrl+C para sair)..."
            tail -f "$AUTH_LOG" "$BACKEND_LOG" "$FRONTEND_LOG"
            ;;
    esac
}

# Limpa logs e PIDs
clean() {
    print_header "LIMPANDO ARQUIVOS TEMPORÁRIOS"
    
    if is_running "$AUTH_PID" || is_running "$BACKEND_PID" || is_running "$FRONTEND_PID"; then
        print_error "Pare os serviços antes de limpar!"
        print_info "Execute: $0 stop"
        exit 1
    fi
    
    rm -rf "$PID_DIR" "$LOG_DIR"
    print_success "Arquivos temporários removidos!"
}

# Menu de ajuda
show_help() {
    cat << EOF
${BLUE}Script de Gerenciamento dos Serviços Locais${NC}

${GREEN}Uso:${NC}
  ./start-services.sh [comando]

${GREEN}Comandos:${NC}
  ${YELLOW}start${NC}       Inicia todos os serviços (libera portas automaticamente)
  ${YELLOW}stop${NC}        Para todos os serviços
  ${YELLOW}restart${NC}     Reinicia todos os serviços
  ${YELLOW}status${NC}      Mostra o status dos serviços
  ${YELLOW}ports${NC}       Libera as portas 8080, 5000, 3000 e 8081
  ${YELLOW}logs${NC}        Mostra logs de todos os serviços
  ${YELLOW}logs auth${NC}   Mostra logs do Auth API
  ${YELLOW}logs backend${NC}  Mostra logs do Backend
  ${YELLOW}logs frontend${NC} Mostra logs do Frontend
  ${YELLOW}clean${NC}       Remove arquivos temporários
  ${YELLOW}help${NC}        Mostra esta mensagem

${GREEN}Portas:${NC}
  - Auth API:    http://localhost:8080
  - Backend API: http://localhost:5000
  - Frontend:    http://localhost:3000 (web) / http://localhost:8081 (expo)

${GREEN}Logs:${NC}
  - Auth:     $AUTH_LOG
  - Backend:  $BACKEND_LOG
  - Frontend: $FRONTEND_LOG

${GREEN}Exemplos:${NC}
  ./start-services.sh start         # Inicia todos os serviços
  ./start-services.sh stop          # Para todos os serviços
  ./start-services.sh status        # Ver status
  ./start-services.sh logs backend  # Ver logs do backend
EOF
}

# Main
main() {
    case "${1:-}" in
        start)
            start_all
            ;;
        stop)
            stop_all
            ;;
        restart)
            restart_all
            ;;
        status)
            show_status
            ;;
        ports)
            free_all_ports
            ;;
        logs)
            show_logs "$2"
            ;;
        clean)
            clean
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            show_help
            ;;
    esac
}

# Executa
main "$@"
