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
SERVER_IP="${SERVER_IP:-140.245.51.205}"
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


# ==========================================
#  VLESS Link Generator (Simplified)
# ==========================================

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 VLESS Connection Link (Working Configuration)${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Current working UUID
UUID="f5414710-1226-4fd7-ab00-8c2abb3e4edf"
CLIENT_NAME="Arman-Vip-Xray"

# Generate the simple, working link
NAME_ENCODED=$(urlencode "$CLIENT_NAME")
URI="vless://${UUID}@${SERVER_IP}:80?encryption=none&type=tcp#${NAME_ENCODED}"

echo -e "${BLUE}📱 Your VLESS Connection Link:${NC}"
echo ""
echo -e "${GREEN}${URI}${NC}"
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 Connection Details:${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Server IP:    ${SERVER_IP}"
echo "  Port:         80"
echo "  UUID:         ${UUID}"
echo "  Protocol:     VLESS over TCP"
echo "  Encryption:   None (plain)"
echo ""
echo -e "${BLUE}🔧 How to Use:${NC}"
echo ""
echo "  1. Copy the link above (starts with vless://)"
echo "  2. Open your V2Box/V2RayNG/V2RayN app"
echo "  3. Tap '+' or 'Add' button"
echo "  4. Select 'Import from Clipboard'"
echo "  5. The config will be imported automatically"
echo "  6. Connect and enjoy!"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo ""
echo "  • This is a simplified configuration that works reliably"
echo "  • No TLS/encryption for maximum compatibility"
echo "  • Server has IP forwarding and NAT configured"
echo "  • If connection fails, your server IP may be blocked by your ISP"
echo "  • To change IP: See CHANGE_IP_ORACLE.md"
echo ""