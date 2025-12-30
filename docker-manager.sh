#!/bin/bash

# Script de gerenciamento dos containers Docker
# Gerencia os 3 projetos: automatic (backend), crypto-exchange-aggregator (frontend) e kong-security-api (auth)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretórios dos projetos
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/automatic"
AUTH_DIR="$(dirname "$SCRIPT_DIR")/kong-security-api"

# Nomes dos containers
FRONTEND_CONTAINER="crypto-frontend"
BACKEND_CONTAINER="crypto-backend"
AUTH_CONTAINER="kong-security-api"

# Network compartilhada
NETWORK_NAME="crypto-network"

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

# Verifica se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker não está rodando. Por favor, inicie o Docker Desktop."
        exit 1
    fi
    print_success "Docker está rodando"
}

# Cria network se não existir
create_network() {
    if ! docker network inspect "$NETWORK_NAME" > /dev/null 2>&1; then
        print_info "Criando network $NETWORK_NAME..."
        docker network create "$NETWORK_NAME"
        print_success "Network criada"
    else
        print_info "Network $NETWORK_NAME já existe"
    fi
}

# Remove network
remove_network() {
    if docker network inspect "$NETWORK_NAME" > /dev/null 2>&1; then
        print_info "Removendo network $NETWORK_NAME..."
        docker network rm "$NETWORK_NAME" 2>/dev/null || true
        print_success "Network removida"
    fi
}

# Build dos containers
build_containers() {
    print_header "BUILDING CONTAINERS"
    check_docker
    create_network

    # Build Auth API (Kong Security)
    print_info "Building Auth API..."
    cd "$AUTH_DIR"
    docker build -t "$AUTH_CONTAINER" .
    print_success "Auth API built"

    # Build Backend (Automatic)
    print_info "Building Backend API..."
    cd "$BACKEND_DIR"
    docker build -t "$BACKEND_CONTAINER" .
    print_success "Backend API built"

    # Build Frontend
    print_info "Building Frontend..."
    cd "$FRONTEND_DIR"
    docker build -t "$FRONTEND_CONTAINER" .
    print_success "Frontend built"

    print_success "Todos os containers foram construídos com sucesso!"
}

# Inicia containers
start_containers() {
    print_header "STARTING CONTAINERS"
    check_docker
    create_network

    # Verifica se as imagens existem, se não, faz o build
    if ! docker image inspect "$AUTH_CONTAINER" > /dev/null 2>&1 || \
       ! docker image inspect "$BACKEND_CONTAINER" > /dev/null 2>&1 || \
       ! docker image inspect "$FRONTEND_CONTAINER" > /dev/null 2>&1; then
        print_info "Algumas imagens não existem. Executando build..."
        build_containers
    fi

    # Inicia Auth API
    print_info "Iniciando Auth API..."
    docker run -d \
        --name "$AUTH_CONTAINER" \
        --network "$NETWORK_NAME" \
        -p 8080:8080 \
        -v "$AUTH_DIR/public.pem:/app/public.pem:ro" \
        -v "$AUTH_DIR/private.pem:/app/private.pem:ro" \
        --restart unless-stopped \
        "$AUTH_CONTAINER" 2>/dev/null || {
            print_info "Container $AUTH_CONTAINER já existe, iniciando..."
            docker start "$AUTH_CONTAINER"
        }
    print_success "Auth API iniciada na porta 8080"

    # Inicia Backend API
    print_info "Iniciando Backend API..."
    if [ -f "$BACKEND_DIR/.env" ]; then
        docker run -d \
            --name "$BACKEND_CONTAINER" \
            --network "$NETWORK_NAME" \
            -p 5000:5000 \
            -v "$BACKEND_DIR/src:/app/src" \
            -v "$BACKEND_DIR/logs:/app/logs" \
            --env-file "$BACKEND_DIR/.env" \
            --restart unless-stopped \
            "$BACKEND_CONTAINER" 2>/dev/null || {
                print_info "Container $BACKEND_CONTAINER já existe, iniciando..."
                docker start "$BACKEND_CONTAINER"
            }
    else
        print_error "Arquivo .env não encontrado em $BACKEND_DIR"
        print_info "Criando container sem variáveis de ambiente..."
        docker run -d \
            --name "$BACKEND_CONTAINER" \
            --network "$NETWORK_NAME" \
            -p 5000:5000 \
            -v "$BACKEND_DIR/src:/app/src" \
            -v "$BACKEND_DIR/logs:/app/logs" \
            --restart unless-stopped \
            "$BACKEND_CONTAINER" 2>/dev/null || {
                docker start "$BACKEND_CONTAINER"
            }
    fi
    print_success "Backend API iniciada na porta 5000"

    # Inicia Frontend
    print_info "Iniciando Frontend..."
    docker run -d \
        --name "$FRONTEND_CONTAINER" \
        --network "$NETWORK_NAME" \
        -p 8081:8081 \
        -p 3000:3000 \
        --restart unless-stopped \
        "$FRONTEND_CONTAINER" 2>/dev/null || {
            print_info "Container $FRONTEND_CONTAINER já existe, iniciando..."
            docker start "$FRONTEND_CONTAINER"
        }
    print_success "Frontend iniciado nas portas 8081 (Expo) e 3000 (Web)"

    print_success "Todos os containers estão rodando!"
    show_status
}

# Para containers
stop_containers() {
    print_header "STOPPING CONTAINERS"
    check_docker

    print_info "Parando containers..."
    docker stop "$AUTH_CONTAINER" 2>/dev/null && print_success "Auth API parada" || print_info "Auth API já estava parada"
    docker stop "$BACKEND_CONTAINER" 2>/dev/null && print_success "Backend API parada" || print_info "Backend API já estava parada"
    docker stop "$FRONTEND_CONTAINER" 2>/dev/null && print_success "Frontend parado" || print_info "Frontend já estava parado"

    print_success "Todos os containers foram parados!"
}

# Limpa tudo (para, remove containers, imagens e network)
clean_all() {
    print_header "CLEANING ALL CONTAINERS AND IMAGES"
    check_docker

    print_info "Parando containers..."
    docker stop "$AUTH_CONTAINER" "$BACKEND_CONTAINER" "$FRONTEND_CONTAINER" 2>/dev/null || true

    print_info "Removendo containers..."
    docker rm "$AUTH_CONTAINER" "$BACKEND_CONTAINER" "$FRONTEND_CONTAINER" 2>/dev/null || true
    print_success "Containers removidos"

    print_info "Removendo imagens..."
    docker rmi "$AUTH_CONTAINER" "$BACKEND_CONTAINER" "$FRONTEND_CONTAINER" 2>/dev/null || true
    print_success "Imagens removidas"

    remove_network

    print_success "Limpeza completa realizada!"
}

# Mostra logs
show_logs() {
    print_header "LOGS DOS CONTAINERS"
    
    local service="$1"
    
    case "$service" in
        auth)
            docker logs -f "$AUTH_CONTAINER"
            ;;
        backend)
            docker logs -f "$BACKEND_CONTAINER"
            ;;
        frontend)
            docker logs -f "$FRONTEND_CONTAINER"
            ;;
        *)
            print_info "Mostrando logs de todos os containers (Ctrl+C para sair)..."
            docker logs -f "$AUTH_CONTAINER" & \
            docker logs -f "$BACKEND_CONTAINER" & \
            docker logs -f "$FRONTEND_CONTAINER" &
            wait
            ;;
    esac
}

# Mostra status dos containers
show_status() {
    print_header "STATUS DOS CONTAINERS"
    
    echo -e "\n${BLUE}Auth API (Kong Security):${NC}"
    docker ps -a --filter "name=$AUTH_CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || print_info "Container não existe"
    
    echo -e "\n${BLUE}Backend API (Automatic):${NC}"
    docker ps -a --filter "name=$BACKEND_CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || print_info "Container não existe"
    
    echo -e "\n${BLUE}Frontend (Crypto Exchange):${NC}"
    docker ps -a --filter "name=$FRONTEND_CONTAINER" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || print_info "Container não existe"
    
    echo ""
}

# Reinicia containers
restart_containers() {
    print_header "RESTARTING CONTAINERS"
    stop_containers
    echo ""
    start_containers
}

# Menu de ajuda
show_help() {
    cat << EOF
${BLUE}Script de Gerenciamento dos Containers Docker${NC}

${GREEN}Uso:${NC}
  ./docker-manager.sh [comando]

${GREEN}Comandos:${NC}
  ${YELLOW}start${NC}       Inicia todos os containers
  ${YELLOW}stop${NC}        Para todos os containers
  ${YELLOW}restart${NC}     Reinicia todos os containers
  ${YELLOW}build${NC}       Reconstrói todas as imagens
  ${YELLOW}clean${NC}       Remove containers, imagens e network
  ${YELLOW}status${NC}      Mostra o status dos containers
  ${YELLOW}logs${NC}        Mostra logs de todos os containers
  ${YELLOW}logs auth${NC}   Mostra logs do Auth API
  ${YELLOW}logs backend${NC}  Mostra logs do Backend
  ${YELLOW}logs frontend${NC} Mostra logs do Frontend
  ${YELLOW}help${NC}        Mostra esta mensagem

${GREEN}Portas:${NC}
  - Auth API:    http://localhost:8080
  - Backend API: http://localhost:5000
  - Frontend:    http://localhost:3000 (web) / http://localhost:8081 (expo)

${GREEN}Exemplos:${NC}
  ./docker-manager.sh start      # Inicia todos os serviços
  ./docker-manager.sh stop       # Para todos os serviços
  ./docker-manager.sh clean      # Limpa tudo e remove imagens
  ./docker-manager.sh logs auth  # Mostra logs do Auth API
EOF
}

# Main
main() {
    case "${1:-}" in
        start)
            start_containers
            ;;
        stop)
            stop_containers
            ;;
        restart)
            restart_containers
            ;;
        build)
            build_containers
            ;;
        clean)
            clean_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Comando inválido: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executa
main "$@"
