#!/bin/bash

# Script para corrigir problemas de network do Docker no Ubuntu
# Resolve erro: Chain 'DOCKER-ISOLATION-STAGE-2' does not exist

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Verifica se está rodando como root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Este script precisa ser executado como root (use sudo)"
        exit 1
    fi
}

# Método 1: Reiniciar Docker
method_restart_docker() {
    print_header "MÉTODO 1: Reiniciando Docker"
    
    print_info "Parando Docker..."
    systemctl stop docker
    sleep 2
    
    print_info "Iniciando Docker..."
    systemctl start docker
    sleep 2
    
    if systemctl is-active --quiet docker; then
        print_success "Docker reiniciado com sucesso!"
        return 0
    else
        print_error "Falha ao reiniciar Docker"
        return 1
    fi
}

# Método 2: Limpar redes Docker órfãs
method_cleanup_networks() {
    print_header "MÉTODO 2: Limpando Redes Órfãs"
    
    print_info "Removendo todas as redes não utilizadas..."
    docker network prune -f
    print_success "Redes limpas!"
}

# Método 3: Resetar iptables do Docker
method_reset_iptables() {
    print_header "MÉTODO 3: Resetando iptables do Docker"
    
    print_info "Removendo regras do Docker..."
    
    # Remove chains do Docker se existirem
    iptables -t nat -F DOCKER 2>/dev/null || true
    iptables -t filter -F DOCKER 2>/dev/null || true
    iptables -t filter -F DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
    iptables -t filter -F DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
    iptables -t filter -F DOCKER-USER 2>/dev/null || true
    
    print_info "Removendo chains do Docker..."
    iptables -t nat -X DOCKER 2>/dev/null || true
    iptables -t filter -X DOCKER 2>/dev/null || true
    iptables -t filter -X DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
    iptables -t filter -X DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
    iptables -t filter -X DOCKER-USER 2>/dev/null || true
    
    print_success "Regras removidas!"
    
    print_info "Reiniciando Docker para recriar as regras..."
    systemctl restart docker
    sleep 3
    
    print_success "Docker reiniciado!"
}

# Método 4: Verificar e corrigir backend do iptables
method_check_iptables_backend() {
    print_header "MÉTODO 4: Verificando Backend do iptables"
    
    print_info "Verificando qual backend está em uso..."
    
    if command -v iptables-legacy &> /dev/null; then
        print_info "iptables-legacy encontrado"
        
        # Verifica qual está em uso
        CURRENT=$(update-alternatives --query iptables | grep "Value:" | awk '{print $2}')
        print_info "Backend atual: $CURRENT"
        
        if [[ "$CURRENT" == *"nft"* ]]; then
            print_info "Mudando para iptables-legacy..."
            update-alternatives --set iptables /usr/sbin/iptables-legacy
            update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
            print_success "Backend alterado para legacy!"
            
            print_info "Reiniciando Docker..."
            systemctl restart docker
            sleep 3
            print_success "Docker reiniciado!"
        else
            print_info "Já está usando iptables-legacy"
        fi
    else
        print_info "iptables-legacy não disponível"
    fi
}

# Testa se a network pode ser criada
test_network_creation() {
    print_header "TESTANDO CRIAÇÃO DE NETWORK"
    
    TEST_NETWORK="test-crypto-network"
    
    print_info "Tentando criar network de teste..."
    if docker network create "$TEST_NETWORK" 2>/dev/null; then
        print_success "Network criada com sucesso!"
        print_info "Removendo network de teste..."
        docker network rm "$TEST_NETWORK"
        return 0
    else
        print_error "Ainda há problemas para criar networks"
        return 1
    fi
}

# Menu principal
show_menu() {
    cat << EOF

${BLUE}=== CORREÇÃO DE PROBLEMAS DE NETWORK DO DOCKER ===${NC}

Escolha uma opção:

  ${YELLOW}1${NC} - Método Rápido (Reiniciar Docker)
  ${YELLOW}2${NC} - Limpar Redes Órfãs
  ${YELLOW}3${NC} - Reset Completo do iptables
  ${YELLOW}4${NC} - Alterar Backend do iptables (legacy/nft)
  ${YELLOW}5${NC} - Executar TODOS os métodos
  ${YELLOW}6${NC} - Testar criação de network
  ${YELLOW}0${NC} - Sair

EOF
}

# Executa todos os métodos
run_all_methods() {
    print_header "EXECUTANDO TODOS OS MÉTODOS"
    
    method_cleanup_networks
    echo ""
    method_reset_iptables
    echo ""
    method_check_iptables_backend
    echo ""
    
    if test_network_creation; then
        print_success "Problema resolvido!"
    else
        print_error "O problema persiste. Tente reiniciar o sistema."
    fi
}

# Main
main() {
    check_root
    
    if [ $# -eq 0 ]; then
        # Modo interativo
        while true; do
            show_menu
            read -p "Digite sua escolha: " choice
            echo ""
            
            case $choice in
                1)
                    method_restart_docker
                    ;;
                2)
                    method_cleanup_networks
                    ;;
                3)
                    method_reset_iptables
                    ;;
                4)
                    method_check_iptables_backend
                    ;;
                5)
                    run_all_methods
                    ;;
                6)
                    test_network_creation
                    ;;
                0)
                    print_info "Saindo..."
                    exit 0
                    ;;
                *)
                    print_error "Opção inválida!"
                    ;;
            esac
            
            echo ""
            read -p "Pressione ENTER para continuar..."
        done
    else
        # Modo não-interativo
        case "$1" in
            restart)
                method_restart_docker
                ;;
            cleanup)
                method_cleanup_networks
                ;;
            reset)
                method_reset_iptables
                ;;
            backend)
                method_check_iptables_backend
                ;;
            all)
                run_all_methods
                ;;
            test)
                test_network_creation
                ;;
            *)
                echo "Uso: sudo $0 [restart|cleanup|reset|backend|all|test]"
                echo "Ou execute sem argumentos para o menu interativo"
                exit 1
                ;;
        esac
    fi
}

main "$@"
