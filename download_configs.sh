#!/bin/bash
# Download VLESS client configs from server

SERVER_IP="217.142.186.18"
SSH_KEY="~/.ssh/oracle-vless-key.pem"
REMOTE_PATH="/root/vless_client_configs"
LOCAL_PATH="$HOME/Downloads"

echo "Downloading VLESS client configs..."
echo "Server: $SERVER_IP"
echo ""

# First, check if configs exist and copy them to a temp location with proper permissions
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@$SERVER_IP "sudo cp $REMOTE_PATH/*.json /tmp/ && sudo chmod 644 /tmp/*.json && ls -lh /tmp/*.json" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "Downloading configs..."
    # Download from /tmp (which ubuntu user can access)
    scp -i ~/.ssh/oracle-vless-key.pem "ubuntu@$SERVER_IP:/tmp/Client-*.json" "$LOCAL_PATH/" 2>&1

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Configs downloaded successfully to: $LOCAL_PATH"
        ls -lh "$LOCAL_PATH"/Client-*.json 2>/dev/null || echo "Files downloaded to Downloads folder"

        echo ""
        echo "📱 Note: Configs are in V2Box-compatible format"
        echo "   To import: V2Box → + → Import → Select JSON file"
    else
        echo "❌ Download failed. Make sure the setup script has been run first."
    fi
else
    echo ""
    echo "❌ Config files not found. Please run the setup script first:"
    echo "   ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@$SERVER_IP"
    echo "   sudo /tmp/setup_vless_v2box.sh"
fi

