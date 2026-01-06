#!/bin/bash
# PG19v2 Multi-Branch Deploy Script
# Usage: ./deploy.sh <branch> [--no-build]
#
# Branches:
#   main    → pg19.doka.team      (production)
#   partner → pg19-partner.doka.team (preview)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
SERVER="doka-server"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

get_worktree_path() {
    case $1 in
        main)    echo "/Users/doka/PG19v2" ;;
        partner) echo "/Users/doka/PG19v2partner" ;;
    esac
}

get_remote_path() {
    case $1 in
        main)    echo "/opt/pg19v2-main" ;;
        partner) echo "/opt/pg19v2-partner" ;;
    esac
}

get_url() {
    case $1 in
        main)    echo "pg19.doka.team" ;;
        partner) echo "pg19-partner.doka.team" ;;
    esac
}

usage() {
    echo -e "${BLUE}PG19v2 Multi-Branch Deploy${NC}"
    echo ""
    echo "Usage: $0 <branch> [options]"
    echo ""
    echo "Branches:"
    echo "  main      Deploy to pg19.doka.team (production)"
    echo "  partner   Deploy to pg19-partner.doka.team (preview)"
    echo "  all       Deploy all branches"
    echo ""
    echo "Options:"
    echo "  --no-build    Skip Docker build, only restart"
    echo "  --status      Show status of all deployments"
    echo ""
    echo "Examples:"
    echo "  $0 main              # Deploy main branch"
    echo "  $0 partner --no-build  # Restart partner without rebuild"
    echo "  $0 all               # Deploy all branches"
    echo "  $0 --status          # Show status"
    exit 1
}

status() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  PG19v2 Deployment Status${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""

    for branch in main partner; do
        local url=$(get_url $branch)
        local container="pg19v2-$branch"

        echo -e "${YELLOW}[$branch]${NC} → https://$url"

        # Check if container exists and get status
        local status=$(ssh $SERVER "docker ps -a --filter name=$container --format '{{.Status}}'" 2>/dev/null || echo "not deployed")

        if [[ "$status" == *"Up"* ]]; then
            echo -e "  Status: ${GREEN}● Running${NC} ($status)"
        elif [[ "$status" == "not deployed" ]] || [[ -z "$status" ]]; then
            echo -e "  Status: ${RED}○ Not deployed${NC}"
        else
            echo -e "  Status: ${RED}○ $status${NC}"
        fi
        echo ""
    done
}

deploy_branch() {
    local branch=$1
    local no_build=$2

    local worktree=$(get_worktree_path $branch)
    local remote_path=$(get_remote_path $branch)
    local url=$(get_url $branch)
    local compose_file="$SCRIPT_DIR/deploy/docker-compose.$branch.yml"

    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Deploying: $branch → https://$url${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""

    # Verify worktree exists
    if [ ! -d "$worktree" ]; then
        echo -e "${RED}Error: Worktree not found: $worktree${NC}"
        exit 1
    fi

    # Verify compose file exists
    if [ ! -f "$compose_file" ]; then
        echo -e "${RED}Error: Compose file not found: $compose_file${NC}"
        exit 1
    fi

    # Get current commit
    local commit=$(cd "$worktree" && git rev-parse --short HEAD)
    local branch_name=$(cd "$worktree" && git branch --show-current)
    echo -e "${YELLOW}►${NC} Branch: $branch_name @ $commit"
    echo ""

    # Step 1: Sync code
    echo -e "${YELLOW}►${NC} Syncing code to server..."
    rsync -avz --delete \
        --exclude=node_modules \
        --exclude=.nuxt \
        --exclude=.output \
        --exclude=.git \
        --exclude=deploy \
        "$worktree/" "$SERVER:$remote_path/"

    # Step 2: Copy docker-compose and Dockerfile
    echo -e "${YELLOW}►${NC} Copying Docker configs..."
    scp "$compose_file" "$SERVER:$remote_path/docker-compose.yml"
    scp "$worktree/Dockerfile" "$SERVER:$remote_path/Dockerfile"

    # Step 3: Build and start
    if [ "$no_build" == "true" ]; then
        echo -e "${YELLOW}►${NC} Restarting container (no build)..."
        ssh $SERVER "cd $remote_path && docker compose restart"
    else
        echo -e "${YELLOW}►${NC} Building and starting container..."
        ssh $SERVER "cd $remote_path && docker compose down 2>/dev/null || true && docker compose up -d --build"
    fi

    # Step 4: Wait and verify
    echo -e "${YELLOW}►${NC} Waiting for container to be healthy..."
    sleep 5

    local status=$(ssh $SERVER "docker ps --filter name=pg19v2-$branch --format '{{.Status}}'" 2>/dev/null)
    if [[ "$status" == *"Up"* ]]; then
        echo ""
        echo -e "${GREEN}✓ Successfully deployed!${NC}"
        echo -e "  URL: https://$url"
        echo -e "  Commit: $commit"
        echo -e "  Status: $status"
    else
        echo -e "${RED}✗ Deployment may have failed. Check logs:${NC}"
        echo "  ssh $SERVER 'docker logs pg19v2-$branch'"
    fi
    echo ""
}

# Parse arguments
BRANCH=""
NO_BUILD="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        main|partner|all)
            BRANCH=$1
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

if [ -z "$BRANCH" ]; then
    usage
fi

# Deploy
if [ "$BRANCH" == "all" ]; then
    for b in main partner; do
        deploy_branch $b $NO_BUILD
    done
else
    deploy_branch $BRANCH $NO_BUILD
fi

echo -e "${GREEN}Done!${NC}"
