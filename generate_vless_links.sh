#!/usr/bin/env bash
# ==================================================
#  generate_vless_links.sh – Fixed VLESS URI Generator
# ==================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="${SERVER_IP:-217.142.186.18}"
SSH_KEY="${SSH_KEY:-~/.ssh/oracle-vless-key.pem}"
SSH_USER="${SSH_USER:-ubuntu}"
CONFIG_PATH="/usr/local/etc/v2ray/config.json"

# URL encode function
urlencode() {
    local string="${1}"
    local strlen=${#string}
    local encoded=""
    local pos c o

    for (( pos=0 ; pos<strlen ; pos++ )); do
        c=${string:$pos:1}
        case "$c" in
            [-_.~a-zA-Z0-9] ) o="${c}" ;;
            * ) printf -v o '%%%02x' "'$c"
        esac
        encoded+="${o}"
    done
    echo "${encoded}"
}

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 VLESS Link Generator${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Expand tilde in SSH key path
SSH_KEY="${SSH_KEY/#\~/$HOME}"

# Check if SSH key exists
if [[ ! -f "$SSH_KEY" ]]; then
    echo -e "${RED}❌ SSH key not found at: $SSH_KEY${NC}"
    echo -e "${YELLOW}   Please set SSH_KEY environment variable${NC}"
    exit 1
fi

echo -e "${YELLOW}📡 Connecting to server...${NC}"

# Read server config via SSH
SERVER_CONFIG=$(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "sudo cat $CONFIG_PATH 2>/dev/null" || echo "")

if [[ -z "$SERVER_CONFIG" ]]; then
    echo -e "${RED}❌ Could not read server config${NC}"
    echo -e "${YELLOW}Possible issues:${NC}"
    echo "  1. V2Ray is not installed"
    echo "  2. Config file doesn't exist at $CONFIG_PATH"
    echo "  3. SSH connection failed"
    echo ""
    echo -e "${YELLOW}Try running:${NC}"
    echo "  ssh -i $SSH_KEY $SSH_USER@$SERVER_IP 'sudo cat $CONFIG_PATH'"
    exit 1
fi

echo -e "${GREEN}✅ Successfully read server config${NC}"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install jq (on Mac) or apt install jq (on Linux)${NC}"
    exit 1
fi

# Parse configuration
# ==========================================
#  VLESS-REALITY Link Generator
# ==========================================

# Reality Settings
PBK="pxnYDBxl1az-cGH68dxXLAqNNMda5b2w2P-lLX6SyAA"
SNI="www.microsoft.com"
FP="chrome"
FLOW="xtls-rprx-vision"
SID="" # ShortID (optional, using empty for now)

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}� VLESS-REALITY Links (Vision Flow)${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

# ==========================================
#  Multi-Protocol VLESS Link Generator
# ==========================================

# Reality Settings
PBK="pxnYDBxl1az-cGH68dxXLAqNNMda5b2w2P-lLX6SyAA"
SNI="www.microsoft.com"
FP="chrome"
FLOW="xtls-rprx-vision"

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 VLESS Connection Links (All Methods)${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

# We use the UUIDs we know are in the config
# (Hardcoded based on what we just pushed to the server to ensure consistency)
UUIDS=("f5414710-1226-4fd7-ab00-8c2abb3e4edf" "b84b349d-e8af-45d9-85d9-08bc561afb62" "1b3374ba-71ca-4c7f-9287-f80451134b97")
NAMES=("Client-1" "Client-2" "Client-3")

for i in "${!UUIDS[@]}"; do
    UUID="${UUIDS[$i]}"
    NAME="${NAMES[$i]}"
    
    echo -e "${BLUE}👤 ${NAME}${NC}"

    # 1. REALITY (Vision) - Best Security
    NAME_REALITY=$(urlencode "${NAME}-Reality")
    URI_REALITY="vless://${UUID}@${SERVER_IP}:443?security=reality&encryption=none&pbk=${PBK}&fp=${FP}&type=tcp&flow=${FLOW}&sni=${SNI}#${NAME_REALITY}"
    echo -e "   ${YELLOW}🔸 Option 1: VLESS-REALITY (Best Security)${NC}"
    echo -e "   ${GREEN}${URI_REALITY}${NC}"
    echo ""

    # 2. TCP (Port 80) - Fallback if TLS blocked
    NAME_TCP=$(urlencode "${NAME}-TCP-80")
    URI_TCP="vless://${UUID}@${SERVER_IP}:80?security=none&encryption=none&type=tcp#${NAME_TCP}"
    echo -e "   ${YELLOW}� Option 2: VLESS-TCP (Port 80 - No TLS)${NC}"
    echo -e "   ${GREEN}${URI_TCP}${NC}"
    echo ""

    # 3. WebSocket (Port 8080) - Alternate
    NAME_WS=$(urlencode "${NAME}-WS-8080")
    # Note: path is /vless
    URI_WS="vless://${UUID}@${SERVER_IP}:8080?security=none&encryption=none&type=ws&path=%2Fvless#${NAME_WS}"
    echo -e "   ${YELLOW}🔸 Option 3: VLESS-WebSocket (Port 8080)${NC}"
    echo -e "   ${GREEN}${URI_WS}${NC}"
    echo ""
    
    echo "   --------------------------------------------------------"
    echo ""
done

echo -e "${YELLOW}ℹ️  TROUBLESHOOTING:${NC}"
echo -e "   1. Try 'Option 2' (TCP/80) first if you have no ping."
echo -e "   2. 'Option 1' (Reality) requires Xray-core in your client settings."
echo ""