# VLESS VPN Server - Oracle Cloud Setup

A simplified and reliable VLESS VPN server setup running on Oracle Cloud with Xray-core. This project provides automated scripts for deploying a working VPN server with maximum compatibility.

## 📋 Project Overview

- **Server Location**: Oracle Cloud
- **Protocol**: VLESS over TCP (simplified)
- **Port**: 80 (HTTP - for maximum compatibility)
- **Core**: Xray 25.12.8
- **Encryption**: None (plain TCP for reliability)
- **Client App**: V2Box, V2RayNG, V2RayN compatible

## 🔑 Current Server Information

### Server Details
```
Public IP:  140.245.51.205
Private IP: 10.0.0.121
Port:       80
Protocol:   VLESS/TCP
UUID:       f5414710-1226-4fd7-ab00-8c2abb3e4edf
```

### SSH Access
```bash
ssh -i ssh-key-2026-01-04.key ubuntu@140.245.51.205
```

## 🚀 Quick Start

### 1. Generate Your VLESS Link
```bash
./generate_vless_links.sh
```

This will output a ready-to-use VLESS URI that you can copy and paste into your V2Box/V2RayNG app.

### 2. Import into Your VPN Client

**For V2Box (iOS/Android):**
1. Copy the VLESS link generated above
2. Open V2Box app
3. Tap `+` → `Import v2ray uri from clipboard`
4. The config will be imported automatically
5. Tap to connect

**For V2RayNG (Android):**
1. Copy the VLESS link
2. Open V2RayNG
3. Tap `+` → `Import config from clipboard`
4. Connect

**For V2RayN (Windows):**
1. Copy the VLESS link
2. Open V2RayN
3. Servers → Import bulk URL from clipboard
4. Connect

### 3. Verify Connection
Once connected, visit [https://ifconfig.me](https://ifconfig.me) to verify your IP shows as `140.245.51.205`.

## � Project Files

| File | Purpose |
|------|---------|
| `generate_vless_links.sh` | Generate VLESS connection links |
| `setup_vless_v2box.sh` | Original setup script (for reference) |
| `CHANGE_IP_ORACLE.md` | Guide on changing server IP if blocked |
| `ssh-key-2026-01-04.key` | SSH private key for server access |

## 🔧 Server Configuration

### Current Xray Config
The server is running a simplified configuration:
- **Inbound**: Port 80, VLESS protocol, TCP transport
- **Outbound**: Direct (freedom protocol)
- **DNS**: Google DNS (8.8.8.8, 8.8.4.4) and Cloudflare (1.1.1.1)
- **Routing**: Blocks private IP ranges
- **IP Forwarding**: Enabled
- **NAT**: Configured with masquerading

### Config Location
```
/usr/local/etc/xray/config.json
```

## �️ Maintenance Commands

### Check Server Status
```bash
# SSH into server
ssh -i ssh-key-2026-01-04.key ubuntu@140.245.51.205

# Check Xray service
sudo systemctl status xray

# View real-time logs
sudo journalctl -u xray -f
```

### Restart Xray Service
```bash
sudo systemctl restart xray
```

### Verify IP Forwarding
```bash
# Should return "1"
sudo sysctl net.ipv4.ip_forward

# If not, enable it
sudo sysctl -w net.ipv4.ip_forward=1
```

### Check NAT Configuration
```bash
sudo iptables -t nat -L -n -v
```

## 🆘 Troubleshooting

### No Connection (Has Ping but No Internet)
This was the issue we fixed! The solution:
```bash
# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# Configure NAT (replace ens3 with your network interface if different)
sudo iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
sudo netfilter-persistent save

# Restart Xray
sudo systemctl restart xray
```

### Server IP Blocked by ISP
If your ISP has blocked the server IP (`140.245.51.205`):

1. Follow the guide in `CHANGE_IP_ORACLE.md`
2. Get a new IP from Oracle Cloud Console
3. Regenerate links with: `./generate_vless_links.sh`

### Connection Works Initially but Stops
Check that Xray is running:
```bash
sudo systemctl status xray
```

If it's stopped, restart it:
```bash
sudo systemctl restart xray
```

### Debug Mode
To see detailed connection logs:
```bash
# SSH into server
ssh -i ssh-key-2026-01-04.key ubuntu@140.245.51.205

# Watch logs in real-time
sudo journalctl -u xray -f
```

Then try connecting from your client. You should see connection attempts in the logs.

## 🔒 Security Notes

### Current Security Posture
- **No TLS/Encryption**: For maximum compatibility and reliability
- **UUID Authentication**: Only clients with the correct UUID can connect
- **Firewall**: Oracle Cloud security lists control access
- **IP Forwarding**: Enabled for routing client traffic

### Why No Encryption?
We chose to disable TLS/encryption for this setup because:
1. Maximum compatibility across all clients and networks
2. Simpler troubleshooting
3. Many ISPs have issues with certain TLS configurations
4. The main goal is bypassing censorship, not hiding from sophisticated attackers

**Note**: If you need encryption, consider these upgrades:
- Add a domain name and enable TLS
- Use VLESS-Reality (requires Xray-core support in client)
- Use WebSocket + TLS (requires domain and certificate)

## 📊 Technical Specifications

### Server Info
- **Instance**: Oracle Cloud Free Tier
- **OS**: Ubuntu 22.04 LTS (ARM64)
- **Xray Version**: 25.12.8
- **Go Version**: 1.25.5
- **Network Interface**: ens3
- **Private IP**: 10.0.0.121
- **Public IP**: 140.245.51.205

### Client UUID
```
f5414710-1226-4fd7-ab00-8c2abb3e4edf
```

**Important**: This UUID is hardcoded in the server config. If you want to add more clients, you'll need to edit `/usr/local/etc/xray/config.json` on the server.

## 🔄 Changing Server IP

If your current IP is blocked by your ISP, follow these steps:

1. Go to Oracle Cloud Console
2. Navigate to your instance → Attached VNICs
3. Edit IPv4 Address → Set to "No Public IP" → Save
4. Edit IPv4 Address again → Set to "Ephemeral Public IP" → Save
5. Note your new IP address
6. Run: `SERVER_IP=<new_ip> ./generate_vless_links.sh`

See `CHANGE_IP_ORACLE.md` for detailed instructions with screenshots.

## � Tips for Best Performance

1. **Choose the right client app**:
   - iOS: V2Box
   - Android: V2RayNG or V2Box
   - Windows: V2RayN
   - macOS: V2RayX or V2RayU

2. **Test your connection**:
   - Use the "ping" or "test" feature in your client app
   - Should show latency < 300ms for good performance

3. **If connection is slow**:
   - Check that you're actually routing through the VPN (visit ifconfig.me)
   - Restart the Xray service on the server
   - Try changing your Oracle Cloud region

## 📝 Change Log

### 2026-01-08 (Current)
- **IP Changed**: `217.142.186.18` → `140.245.51.205` (old IP blocked by ISP)
- **Core Upgrade**: V2Ray → Xray 25.12.8
- **Config Simplified**: Removed multi-port setup, using single port 80
- **Fixed**: IP forwarding issue (server accepted connections but no internet)
- **Fixed**: NAT configuration for routing client traffic
- **Updated**: Link generator to produce simple, working VLESS URIs

### 2026-01-04 (Original)
- Initial setup with V2Ray
- WebSocket + Reality configurations
- Multiple client UUIDs

---

**Status**: ✅ Server is active and working perfectly
**Last Updated**: January 8, 2026, 04:30 AM
**Last Verified**: Connection working with simplified TCP config
