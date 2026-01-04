#!/usr/bin/env bash
# ==================================================
#  generate_vless_uris.sh – Generate VLESS URIs from server config
# ==================================================
set -euo pipefail

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

# Configuration
SERVER_IP="${SERVER_IP:-217.142.186.18}"
SSH_KEY="${SSH_KEY:-~/.ssh/oracle-vless-key.pem}"
SSH_USER="${SSH_USER:-ubuntu}"
CONFIG_PATH="/etc/v2ray/config.json"
CLIENT_NAMES="${CLIENT_NAMES:-}"

echo "🔍 Reading V2Ray server configuration..."
echo ""

# Read server config via SSH
if [[ -f "${SSH_KEY/#\~/$HOME}" ]]; then
    SSH_KEY="${SSH_KEY/#\~/$HOME}"
    SERVER_CONFIG=$(ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "sudo cat $CONFIG_PATH 2>/dev/null" || echo "")
else
    echo "❌ SSH key not found at: $SSH_KEY"
    echo "   Please set SSH_KEY environment variable or ensure key exists"
    exit 1
fi

if [[ -z "$SERVER_CONFIG" ]]; then
    echo "❌ Could not read server config. Is V2Ray installed and running?"
    exit 1
fi

# Extract configuration using jq (or basic parsing)
if command -v jq &> /dev/null; then
    # Use jq for reliable JSON parsing
    INBOUND=$(echo "$SERVER_CONFIG" | jq '.inbounds[0]')
    PORT=$(echo "$INBOUND" | jq -r '.port')
    NETWORK=$(echo "$INBOUND" | jq -r '.streamSettings.network // "ws"')
    PATH_VAL=$(echo "$INBOUND" | jq -r '.streamSettings.wsSettings.path // "/vless"')
    SECURITY=$(echo "$INBOUND" | jq -r '.streamSettings.security // "none"')
    
    # Extract all clients
    CLIENTS=$(echo "$INBOUND" | jq -c '.settings.clients[]')
    
    # Get server IP/host from domain or use provided IP
    HOST=$(echo "$INBOUND" | jq -r '.streamSettings.wsSettings.headers.Host // empty')
    if [[ -z "$HOST" || "$HOST" == "null" ]]; then
        HOST="$SERVER_IP"
    fi
else
    # Fallback: basic parsing without jq
    echo "⚠️  jq not found, using basic parsing..."
    PORT="443"
    NETWORK="ws"
    PATH_VAL="/vless"
    SECURITY="none"
    HOST="$SERVER_IP"
    
    # Extract UUIDs using grep/sed
    CLIENTS=$(echo "$SERVER_CONFIG" | grep -o '"id":"[^"]*"' | sed 's/"id":"\([^"]*\)"/\1/')
fi

echo "═══════════════════════════════════════════════════════════"
echo "🔗 VLESS URIs (Copy and paste into V2Box):"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Generate URIs for each client
CLIENT_NUM=1
# Parse custom client names if provided
if [[ -n "$CLIENT_NAMES" ]]; then
    IFS=',' read -ra CUSTOM_NAMES <<< "$CLIENT_NAMES"
fi

if command -v jq &> /dev/null; then
    # Process with jq
    while IFS= read -r client; do
        UUID=$(echo "$client" | jq -r '.id')
        EMAIL=$(echo "$client" | jq -r '.email // ""')

        # Extract client name from custom names, email, or use default
        if [[ -n "$CLIENT_NAMES" && $CLIENT_NUM -le ${#CUSTOM_NAMES[@]} ]]; then
            CLIENT_NAME="${CUSTOM_NAMES[$((CLIENT_NUM-1))]}"
        elif [[ "$EMAIL" == *"@local" ]]; then
            CLIENT_NAME=$(echo "$EMAIL" | sed 's/@local//')
        else
            CLIENT_NAME="Client-$CLIENT_NUM"
        fi
        
        # URL encode path and host
        PATH_ENCODED=$(urlencode "$PATH_VAL")
        HOST_ENCODED=$(urlencode "$HOST")
        CLIENT_NAME_ENCODED=$(urlencode "$CLIENT_NAME")
        
        # Build URI
        URI="vless://${UUID}@${HOST}:${PORT}?type=${NETWORK}&security=${SECURITY}&path=${PATH_ENCODED}&host=${HOST_ENCODED}#${CLIENT_NAME_ENCODED}"
        
        echo "${CLIENT_NAME}:"
        echo "${URI}"
        echo ""
        
        CLIENT_NUM=$((CLIENT_NUM + 1))
    done <<< "$CLIENTS"
else
    # Fallback: process UUIDs from grep
    while IFS= read -r UUID; do
        # Extract client name from custom names or use default
        if [[ -n "$CLIENT_NAMES" && $CLIENT_NUM -le ${#CUSTOM_NAMES[@]} ]]; then
            CLIENT_NAME="${CUSTOM_NAMES[$((CLIENT_NUM-1))]}"
        else
            CLIENT_NAME="Client-$CLIENT_NUM"
        fi
        
        # URL encode path and host
        PATH_ENCODED=$(urlencode "$PATH_VAL")
        HOST_ENCODED=$(urlencode "$HOST")
        CLIENT_NAME_ENCODED=$(urlencode "$CLIENT_NAME")
        
        # Build URI
        URI="vless://${UUID}@${HOST}:${PORT}?type=${NETWORK}&security=${SECURITY}&path=${PATH_ENCODED}&host=${HOST_ENCODED}#${CLIENT_NAME_ENCODED}"
        
        echo "${CLIENT_NAME}:"
        echo "${URI}"
        echo ""
        
        CLIENT_NUM=$((CLIENT_NUM + 1))
    done <<< "$CLIENTS"
fi

echo "═══════════════════════════════════════════════════════════"
echo "📱 To import:"
echo "   1️⃣  Copy any URI above"
echo "   2️⃣  Open V2Box → + → Import v2ray uri from clipboard"
echo "   3️⃣  Paste the URI"
echo "   4️⃣  Save and enable the connection"
echo "═══════════════════════════════════════════════════════════"
