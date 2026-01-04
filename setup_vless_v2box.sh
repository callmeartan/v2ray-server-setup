#!/usr/bin/env bash
# ==================================================
#  setup_vless_v2box.sh – One‑click VLESS + V2Box
# ==================================================
set -euo pipefail
trap 'echo >&2 "Error on line $LINENO. Exiting…"; exit 1' ERR

# ---- 1️⃣ Basic environment  ---------------------------------
echo "🛠️  Updating system packages…"
apt-get update -y && apt-get upgrade -y

# ---- 2️⃣ Install essential tools ----------------------------
echo "🔧 Installing curl, wget, unzip, git, qrencode, jq …"
apt-get install -y curl wget unzip git qrencode jq uuid-runtime

# ---- 3️⃣ (Optional) Domain & TLS  --------------------------
if [[ -t 0 ]]; then
    read -rp "📬 Enter your fully‑qualified domain (e.g. example.com) or leave empty to skip TLS: " DOMAIN
else
    DOMAIN=""
    echo "⚠️  Running non-interactively - using IP-only setup (no TLS)."
fi
if [[ -n "$DOMAIN" ]]; then
    echo "🛡️  Setting up Let's Encrypt TLS for $DOMAIN…"
    apt-get install -y nginx
    systemctl stop nginx 2>/dev/null || true
    # Basic Nginx stub for certbot
    cat >/etc/nginx/sites-available/default <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/html;
    index index.html index.htm;
}
EOF
    systemctl start nginx
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@"$DOMAIN" 2>/dev/null || {
        echo "⚠️  Certbot failed. Continuing without TLS certificate."
        DOMAIN=""
        TLS_CERT=""
        TLS_KEY=""
    }
    if [[ -n "$DOMAIN" ]]; then
        TLS_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
        TLS_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
        # Verify certificates exist
        if [[ ! -f "$TLS_CERT" ]] || [[ ! -f "$TLS_KEY" ]]; then
            echo "⚠️  TLS certificates not found. Continuing without TLS."
            DOMAIN=""
            TLS_CERT=""
            TLS_KEY=""
        fi
    fi
else
    echo "⚠️  No domain entered – proceeding without TLS."
    TLS_CERT=""
    TLS_KEY=""
fi

# ---- 4️⃣ Install V2Ray (core) --------------------------------
echo "🚀 Installing V2Ray core…"
if ! command -v v2ray &> /dev/null; then
    # Use the new fhs-install-v2ray method
    bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh)
else
    echo "✅ V2Ray is already installed"
fi

# ---- 5️⃣ Prepare VLESS config --------------------------------
SERVER_IP=$(curl -s4 icanhazip.com || curl -s4 ifconfig.me || echo "YOUR_SERVER_IP")
echo "🌍 Server IP detected: $SERVER_IP"

# Create a temporary dir for config generation
WORKDIR=$(mktemp -d)
pushd "$WORKDIR"

# Default TLS parameters
TLS_ENABLED="false"
if [[ -n "$TLS_CERT" ]] && [[ -n "$TLS_KEY" ]] && [[ -n "$DOMAIN" ]]; then
    TLS_ENABLED="tls"
fi

# Generate multiple client UUIDs first
NUM_CLIENTS=3
echo "📄 Generating $NUM_CLIENTS VLESS client configs…"

CLIENT_UUIDS=()
CLIENT_NAMES=()
mkdir -p client_configs

# Generate all UUIDs and client configs first
for i in $(seq 1 $NUM_CLIENTS); do
    UUID=$(uuidgen)
    CLIENT_NAME="Client-$i"
    CLIENT_UUIDS+=("$UUID")
    CLIENT_NAMES+=("$CLIENT_NAME")
    
    # Generate client config JSON (Full V2Box compatible format)
    CLIENT_HOST="${DOMAIN:-$SERVER_IP}"
    CLIENT_SECURITY="none"
    if [[ "$TLS_ENABLED" == "tls" ]]; then
        CLIENT_SECURITY="tls"
    fi

    cat > "client_configs/$CLIENT_NAME.json" <<EOF
{
  "log": {},
  "inbounds": [
      {
        "port": 10808,
        "tag": "socks",
        "settings": {
          "udp": true,
          "userLevel": 8,
          "auth": "noauth"
        },
        "listen": "127.0.0.1",
        "protocol": "socks"
      },
      {
        "port": 1087,
        "tag": "directSocks",
        "settings": {
          "udp": true,
          "userLevel": 8,
          "auth": "noauth"
        },
        "listen": "127.0.0.1",
        "protocol": "socks"
      },
      {
        "port": 62789,
        "tag": "api",
        "settings": {
          "address": "[::1]"
        },
        "listen": "[::1]",
        "protocol": "dokodemo-door"
      }
    ],
  "outbounds": [
      {
        "mux": {
          "concurrency": 8,
          "enabled": false
        },
        "streamSettings": {
          "wsSettings": {
            "path": "/vless",
            "headers": {
              "Host": "$CLIENT_HOST"
            }
          },
          "network": "ws",
          "security": "$CLIENT_SECURITY"
        },
        "tag": "proxy",
        "settings": {
          "vnext": [
            {
              "users": [
                {
                  "email": "",
                  "level": 0,
                  "encryption": "none",
                  "id": "$UUID",
                  "flow": ""
                }
              ],
              "port": 443,
              "address": "$CLIENT_HOST"
            }
          ]
        },
        "protocol": "vless"
      },
      {
        "protocol": "freedom",
        "settings": {},
        "tag": "direct"
      },
      {
        "protocol": "blackhole",
        "settings": {},
        "tag": "block"
      },
      {
        "protocol": "dns",
        "settings": {},
        "tag": "dns-out"
      }
    ],
  "api": {
      "tag": "api",
      "services": [
        "StatsService"
      ]
    },
  "dns": {
      "servers": [
        {
          "address": "8.8.8.8",
          "skipFallback": false
        }
      ],
      "queryStrategy": "UseIP",
      "tag": "dnsQuery"
    },
  "stats": {},
  "routing": {
        "domainStrategy": "AsIs",
        "rules": [
            {
              "outboundTag": "api",
              "type": "field",
              "inboundTag": [
                "api"
              ]
            },
            {
              "outboundTag": "direct",
              "type": "field",
              "inboundTag": [
                "directSocks"
              ]
            },
            {
              "outboundTag": "dns-out",
              "type": "field",
              "inboundTag": [
                "dnsQuery"
              ]
            }
          ]
      },
  "policy": {
        "system": {
          "statsInboundUplink": true,
          "statsInboundDownlink": true
        },
        "levels": {
          "8": {
            "connIdle": 30,
            "handshake": 4
          }
        }
      }
}
EOF
    echo "✅  Generated $CLIENT_NAME.json"
done

# Generate server config with ALL clients
echo "🗂️  Creating server configuration with all clients…"

# Build clients array JSON
CLIENTS_JSON="["
for i in "${!CLIENT_UUIDS[@]}"; do
    UUID="${CLIENT_UUIDS[$i]}"
    NAME="${CLIENT_NAMES[$i]}"
    if [[ $i -gt 0 ]]; then
        CLIENTS_JSON+=","
    fi
    CLIENTS_JSON+="{\"id\":\"$UUID\",\"alterId\":0,\"email\":\"$NAME@local\"}"
done
CLIENTS_JSON+="]"

# Create server config template
if [[ "$TLS_ENABLED" == "tls" ]] && [[ -n "$DOMAIN" ]]; then
    # With TLS
    cat > config.json <<EOF
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": $CLIENTS_JSON,
        "decryption": "none"
      },
      "streamSettings": {
        "network": "ws",
        "security": "tls",
        "tlsSettings": {
          "certificates": [
            {
              "certificateFile": "$TLS_CERT",
              "keyFile": "$TLS_KEY"
            }
          ]
        },
        "wsSettings": {
          "path": "/vless",
          "headers": {
            "Host": "$DOMAIN"
          }
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    }
  ]
}
EOF
else
    # Without TLS
    cat > config.json <<EOF
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": $CLIENTS_JSON,
        "decryption": "none"
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
          "path": "/vless"
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    }
  ]
}
EOF
fi

# Validate JSON before proceeding
if ! jq empty config.json 2>/dev/null; then
    echo "❌ Error: Generated server config is not valid JSON. Exiting."
    exit 1
fi

# Move the final server config to /etc/v2ray
echo "🗂️  Installing server config…"
mkdir -p /etc/v2ray
cp config.json /etc/v2ray/config.json

# ---- 6️⃣ Enable & start V2Ray --------------------------------
echo "🚀 Starting V2Ray…"
systemctl daemon-reload
systemctl enable v2ray.service
systemctl restart v2ray.service
sleep 2

if systemctl is-active --quiet v2ray.service; then
    echo "✅ V2Ray service is running"
    systemctl status v2ray.service --no-pager -l | head -20
else
    echo "❌ V2Ray service failed to start. Check logs with: systemctl status v2ray.service"
    exit 1
fi

# ---- 7️⃣ Show client configs & QR codes --------------------
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔍 Client configuration files:"
echo "═══════════════════════════════════════════════════════════"
ls -lh client_configs/

# Copy client configs to a permanent location
CLIENT_DIR="/root/vless_client_configs"
mkdir -p "$CLIENT_DIR"
cp client_configs/*.json "$CLIENT_DIR/"
echo ""
echo "💾 Client configs saved to: $CLIENT_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📱 QR codes (scan with V2Box to import):"
echo "═══════════════════════════════════════════════════════════"
for f in client_configs/*.json; do
    BASENAME=$(basename "$f")
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 $BASENAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    qrencode -t UTF8 -l L < "$f" || echo "⚠️  QR code generation failed (qrencode may need adjustment)"
    echo ""
done

# Generate VLESS URIs
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔗 VLESS URIs (Copy and paste into V2Box):"
echo "═══════════════════════════════════════════════════════════"
echo ""

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

# Generate URIs for each client
CLIENT_HOST="${DOMAIN:-$SERVER_IP}"
PORT="443"
NETWORK="ws"
PATH_VAL="/vless"
if [[ "$TLS_ENABLED" == "tls" ]]; then
    SECURITY="tls"
else
    SECURITY="none"
fi

for i in "${!CLIENT_UUIDS[@]}"; do
    UUID="${CLIENT_UUIDS[$i]}"
    CLIENT_NAME="${CLIENT_NAMES[$i]}"
    
    # URL encode only the client name (fragment)
    CLIENT_NAME_ENCODED=$(urlencode "$CLIENT_NAME")
    
    # Build URI - don't URL encode path/host, and omit security when none
    if [[ "$SECURITY" == "none" ]]; then
        URI="vless://${UUID}@${CLIENT_HOST}:${PORT}?type=${NETWORK}&path=${PATH_VAL}&host=${CLIENT_HOST}#${CLIENT_NAME_ENCODED}"
    else
        URI="vless://${UUID}@${CLIENT_HOST}:${PORT}?type=${NETWORK}&security=${SECURITY}&path=${PATH_VAL}&host=${CLIENT_HOST}#${CLIENT_NAME_ENCODED}"
    fi
    
    echo "${CLIENT_NAME}:"
    echo "${URI}"
    echo ""
done

echo "═══════════════════════════════════════════════════════════"
echo "🎉 Setup Complete! 🎉"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "⚡️  Your VLESS server is running on port 443"
if [[ -n "$DOMAIN" ]]; then
    echo "🌐 Domain: $DOMAIN"
    echo "🔒 TLS: Enabled"
else
    echo "⚠️  TLS: Disabled (using IP: $SERVER_IP)"
fi
echo ""
echo "📥 To import into V2Box:"
echo "   Option 1 - URI (Recommended):"
echo "   1️⃣  Copy any VLESS URI from above"
echo "   2️⃣  Open V2Box → + → Import v2ray uri from clipboard"
echo "   3️⃣  Paste the URI and save"
echo ""
echo "   Option 2 - JSON file:"
echo "   1️⃣  Copy JSON files from: $CLIENT_DIR"
echo "   2️⃣  Open V2Box → + → Import → Choose JSON file"
echo "   3️⃣  Save and enable the connection"
echo ""
echo "🧪 Test your server:"
if [[ -n "$DOMAIN" ]]; then
    echo "   curl -k -v https://$DOMAIN:443/vless"
else
    echo "   curl -v http://$SERVER_IP:443/vless"
fi
echo ""
echo "🛠️  Useful commands:"
echo "   • View V2Ray logs: journalctl -u v2ray.service -f"
echo "   • Restart V2Ray: systemctl restart v2ray.service"
echo "   • View config: cat /etc/v2ray/config.json"
echo ""

popd
rm -rf "$WORKDIR"

