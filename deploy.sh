#!/bin/bash
# PG19v2 Multi-Portal Deploy Script
# Usage: ./deploy.sh <portal> [dev|prod] [--no-build]
#
# Portals (flat subdomain scheme for Cloudflare SSL):
#   main    → pg19.doka.team / dev-pg19.doka.team
#   land    → pg19-land.doka.team / dev-pg19-land.doka.team
#   partner → pg19-partner.doka.team / dev-pg19-partner.doka.team
#   client  → pg19-client.doka.team / dev-pg19-client.doka.team
#   admin   → pg19-admin.doka.team / dev-pg19-admin.doka.team

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Config
SERVER="doka-server"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTALS="main land partner client admin"

get_worktree_path() {
    case $1 in
        main)    echo "/Users/doka/PG19v2" ;;
        land)    echo "/Users/doka/PG19v2land" ;;
        partner) echo "/Users/doka/PG19v2partner" ;;
        client)  echo "/Users/doka/PG19v2client" ;;
        admin)   echo "/Users/doka/PG19v2admin" ;;
    esac
}

get_remote_path() {
    local portal=$1
    local env=$2
    if [ "$env" == "dev" ]; then
        echo "/opt/pg19-dev-$portal"
    else
        echo "/opt/pg19-$portal"
    fi
}

get_url() {
    local portal=$1
    local env=$2
    # Flat subdomain scheme: pg19-{portal}.doka.team (works with Cloudflare free SSL)
    if [ "$env" == "dev" ]; then
        if [ "$portal" == "main" ]; then
            echo "dev-pg19.doka.team"
        else
            echo "dev-pg19-$portal.doka.team"
        fi
    else
        if [ "$portal" == "main" ]; then
            echo "pg19.doka.team"
        else
            echo "pg19-$portal.doka.team"
        fi
    fi
}

get_container_name() {
    local portal=$1
    local env=$2
    if [ "$env" == "dev" ]; then
        echo "pg19-dev-$portal"
    else
        echo "pg19-$portal"
    fi
}

usage() {
    echo -e "${BLUE}PG19v2 Multi-Portal Deploy${NC}"
    echo ""
    echo "Usage: $0 <portal> [env] [options]"
    echo ""
    echo "Portals:"
    echo "  main      Main site (pg19.doka.team)"
    echo "  land      Landing page (pg19-land.doka.team)"
    echo "  partner   Partner portal (pg19-partner.doka.team)"
    echo "  client    Client cabinet (pg19-client.doka.team)"
    echo "  admin     Admin panel (pg19-admin.doka.team)"
    echo "  all       Deploy all portals"
    echo ""
    echo "Environments:"
    echo "  prod      Production (default)"
    echo "  dev       Development preview (dev-pg19-*.doka.team)"
    echo ""
    echo "Options:"
    echo "  --no-build    Skip Docker build, only restart"
    echo "  --status      Show status of all deployments"
    echo ""
    echo "Examples:"
    echo "  $0 client              # Deploy client to prod"
    echo "  $0 client dev          # Deploy client to dev"
    echo "  $0 partner prod --no-build  # Restart partner prod"
    echo "  $0 all dev             # Deploy all to dev"
    echo "  $0 --status            # Show all statuses"
    exit 1
}

status() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  PG19v2 Deployment Status${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    for env in prod dev; do
        echo -e "${CYAN}[$env]${NC}"
        echo ""
        for portal in $PORTALS; do
            local url=$(get_url $portal $env)
            local container=$(get_container_name $portal $env)

            printf "  %-10s → https://%s\n" "$portal" "$url"

            # Check if container exists and get status
            local status=$(ssh $SERVER "docker ps -a --filter name=^${container}$ --format '{{.Status}}'" 2>/dev/null || echo "")

            if [[ "$status" == *"Up"* ]]; then
                echo -e "             ${GREEN}● Running${NC} ($status)"
            elif [[ -z "$status" ]]; then
                echo -e "             ${RED}○ Not deployed${NC}"
            else
                echo -e "             ${RED}○ $status${NC}"
            fi
        done
        echo ""
    done
}

deploy_portal() {
    local portal=$1
    local env=$2
    local no_build=$3

    local worktree=$(get_worktree_path $portal)
    local remote_path=$(get_remote_path $portal $env)
    local url=$(get_url $portal $env)
    local container=$(get_container_name $portal $env)
    local compose_file="$SCRIPT_DIR/deploy/docker-compose.$portal.yml"

    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Deploying: $portal ($env) → https://$url${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Verify worktree exists
    if [ ! -d "$worktree" ]; then
        echo -e "${RED}Error: Worktree not found: $worktree${NC}"
        return 1
    fi

    # Verify compose file exists
    if [ ! -f "$compose_file" ]; then
        echo -e "${YELLOW}Warning: Compose file not found: $compose_file${NC}"
        echo -e "${YELLOW}Creating from template...${NC}"
        create_compose_file $portal
    fi

    # Get current commit
    local commit=$(cd "$worktree" && git rev-parse --short HEAD)
    local branch_name=$(cd "$worktree" && git branch --show-current)
    echo -e "${YELLOW}►${NC} Branch: $branch_name @ $commit"
    echo -e "${YELLOW}►${NC} Environment: $env"
    echo ""

    # Step 1: Create remote directory
    echo -e "${YELLOW}►${NC} Preparing server directory..."
    ssh $SERVER "sudo mkdir -p $remote_path && sudo chown vv:vv $remote_path"

    # Step 2: Sync code
    echo -e "${YELLOW}►${NC} Syncing code to server..."
    rsync -avz --delete \
        --exclude=node_modules \
        --exclude=.nuxt \
        --exclude=.output \
        --exclude=.git \
        --exclude=deploy \
        "$worktree/" "$SERVER:$remote_path/"

    # Step 3: Generate docker-compose for this environment
    echo -e "${YELLOW}►${NC} Generating Docker configs..."
    generate_compose $portal $env "$remote_path"
    scp "$worktree/Dockerfile" "$SERVER:$remote_path/Dockerfile"

    # Step 4: Build and start
    if [ "$no_build" == "true" ]; then
        echo -e "${YELLOW}►${NC} Restarting container (no build)..."
        ssh $SERVER "cd $remote_path && docker compose restart"
    else
        echo -e "${YELLOW}►${NC} Building and starting container..."
        ssh $SERVER "cd $remote_path && docker compose down 2>/dev/null || true && docker compose up -d --build"
    fi

    # Step 5: Wait and verify
    echo -e "${YELLOW}►${NC} Waiting for container to be healthy..."
    sleep 5

    local status=$(ssh $SERVER "docker ps --filter name=^${container}$ --format '{{.Status}}'" 2>/dev/null)
    if [[ "$status" == *"Up"* ]]; then
        echo ""
        echo -e "${GREEN}✓ Successfully deployed!${NC}"
        echo -e "  URL: https://$url"
        echo -e "  Commit: $commit"
        echo -e "  Container: $container"
        echo -e "  Status: $status"
    else
        echo -e "${RED}✗ Deployment may have failed. Check logs:${NC}"
        echo "  ssh $SERVER 'docker logs $container'"
    fi
    echo ""
}

generate_compose() {
    local portal=$1
    local env=$2
    local remote_path=$3

    local url=$(get_url $portal $env)
    local container=$(get_container_name $portal $env)

    # Generate docker-compose.yml on the server
    ssh $SERVER "cat > $remote_path/docker-compose.yml" << COMPOSE_EOF
services:
  $container:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        SUPABASE_URL: https://supabase.doka.team
        SUPABASE_KEY: eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjogImFub24iLCAiaXNzIjogInN1cGFiYXNlIiwgImlhdCI6IDE3MzQ3ODk2MDAsICJleHAiOiAxODkyNTU2MDAwfQ.YJP-6T2G5m3ReyA1mCzzGRCzdzxWxOXwusRitdb_vp4
        TELEGRAM_BOT_USERNAME: PG19CONNECTBOT
        YANDEX_MAPS_API_KEY: 303647fa-c3a2-4d28-a4e7-1073c9478de3
    container_name: $container
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NUXT_TELEGRAM_BOT_TOKEN=8239443842:AAGNXne9Z8oASGk56AZRB0LxdxbJCXn6XDI
      - NUXT_SUPABASE_SERVICE_KEY=eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjogInNlcnZpY2Vfcm9sZSIsICJpc3MiOiAic3VwYWJhc2UiLCAiaWF0IjogMTczNDc4OTYwMCwgImV4cCI6IDE4OTI1NTYwMDB9.pn3oy2eKMXejztAJqluImJbji4utpQOKp-7hlAN0IxM
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1:3000/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    labels:
      - "traefik.enable=true"
      - traefik.http.routers.$container.rule=Host(\`$url\`)
      - "traefik.http.services.$container.loadbalancer.server.port=3000"
    networks:
      - pg19-network

networks:
  pg19-network:
    external: true
COMPOSE_EOF
}

create_compose_file() {
    local portal=$1
    local compose_file="$SCRIPT_DIR/deploy/docker-compose.$portal.yml"

    mkdir -p "$SCRIPT_DIR/deploy"

    cat > "$compose_file" << 'EOF'
# Auto-generated compose file
# Will be regenerated during deploy with correct environment settings
EOF
    echo -e "${GREEN}Created: $compose_file${NC}"
}

# Parse arguments
PORTAL=""
ENV="prod"
NO_BUILD="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        main|land|partner|client|admin|all)
            PORTAL=$1
            shift
            ;;
        dev|prod)
            ENV=$1
            shift
            ;;
        --no-build)
            NO_BUILD="true"
            shift
            ;;
        --status)
            status
            exit 0
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

if [ -z "$PORTAL" ]; then
    usage
fi

# Deploy
if [ "$PORTAL" == "all" ]; then
    for p in $PORTALS; do
        deploy_portal $p $ENV $NO_BUILD
    done
else
    deploy_portal $PORTAL $ENV $NO_BUILD
fi

echo -e "${GREEN}Done!${NC}"
