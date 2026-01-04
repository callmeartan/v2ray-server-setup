# VLESS VPN Server - Oracle Cloud Setup

A complete VLESS VPN server setup running on Oracle Cloud with V2Ray core. This project provides automated setup scripts and comprehensive documentation for deploying and maintaining a secure VPN server.

## 📋 Project Overview

- **Server Location**: Oracle Cloud (Singapore)
- **Protocol**: VLESS + WebSocket
- **Port**: 443 (HTTPS)
- **TLS**: Disabled (IP-only setup)
- **Client App**: V2Box compatible

## 🔑 Server Connection Information

### SSH Access
```
Host: 217.142.186.18
User: ubuntu
Port: 22
Key: ~/.ssh/oracle-vless-key.pem
```

### SSH Public Key (for reference)
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC2Vkz7G8wdhkZSJ74uQqylMUSHcuPiK4NOB0RscJED22Qqah1y0PWTSkMgcDaLhuGucjDc94lSyIvLvZ5duL60f8+xPfLPI6dVbJ9UqSLRi0yv0pFZeDv+kfHI+gUCzG/Y3hNSUfFsKZmyeyydxT+6pBAv8/wQm10HR31XPEaDokehKhubuqnNH5um9VpPy02XbH2EpTP1L7sr9yKj5ZwEIv8q9zb7uHPBUSGmc/G9tfW0QBLW6z+6/u3xUmMERNmKExnBvUKLtbyLCFuUncWGLdzEn+HuXUJrW5ctDX1Mt/fLTPSyv1UbUXlg8FE0bakUPI48h+wBuiax5U/LN9H/ ssh-key-2026-01-04
```

## 🚀 Quick Start

### 1. SSH into Server
```bash
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18
```

### 2. Run Setup Script
```bash
sudo /tmp/setup_vless_v2box.sh
```

### 3. Generate VLESS URIs (Recommended - Easiest Method)
Generate copy-paste URIs for V2Box:
```bash
./generate_vless_uris.sh
```
Copy any URI and paste it into V2Box using "Import v2ray uri from clipboard"

### 4. Download Client Configs (Alternative - JSON Files)
```bash
./download_configs.sh
```

### 5. Convert Config Format (if needed)
If you have configs in the old format, convert them to V2Box format:
```bash
python3 convert_to_v2box.py old_config.json > new_config.json
```

## 📱 Client Configurations

Three client configurations have been generated. You can import them into V2Box using either method:

### Method 1: VLESS URI (Recommended - Easiest)
Generate and copy VLESS URIs using:
```bash
./generate_vless_uris.sh
```
Then in V2Box: `+` → `Import v2ray uri from clipboard` → Paste URI

### Method 2: JSON Files
JSON configuration files are available in `~/Downloads/`:

### Client 1 (Full V2Box Format)
```json
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
              "Host": "217.142.186.18"
            }
          },
          "network": "ws",
          "security": "none"
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
                  "id": "f5414710-1226-4fd7-ab00-8c2abb3e4edf",
                  "flow": ""
                }
              ],
              "port": 443,
              "address": "217.142.186.18"
            }
          ]
        },
        "protocol": "vless"
      },
      {
        "protocol": "freedom",
        "settings": {},
        "tag": "direct"
      }
    ],
  "routing": {
        "domainStrategy": "AsIs",
        "rules": [
            {
              "outboundTag": "direct",
              "type": "field",
              "inboundTag": [
                "directSocks"
              ]
            }
          ]
      }
}
```

### Client 2 (Full V2Box Format)
Contains the same structure as Client-1 but with UUID: `b84b349d-e8af-45d9-85d9-08bc561afb62`

### Client 3 (Full V2Box Format)
Contains the same structure as Client-1 but with UUID: `1b3374ba-71ca-4c7f-9287-f80451134b97`

## 🛠️ Files and Scripts

| File | Purpose |
|------|---------|
| `frontend/` | **NEW!** Web interface for config management |
| `setup_vless_v2box.sh` | Main setup script for V2Ray + VLESS |
| `generate_vless_uris.sh` | Generate VLESS URIs for copy-paste import |
| `download_configs.sh` | Downloads client configs from server |
| `convert_to_v2box.py` | Convert configs to V2Box format |
| `README.md` | Complete documentation |
| `QUICK_START.md` | Quick start guide |
| `SETUP_GUIDE.md` | Detailed setup instructions |
| `FIX_PUBLIC_IP.md` | IP configuration troubleshooting |

## 🔧 Maintenance Commands

### Check Server Status
```bash
# SSH into server first
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18

# Check V2Ray service
sudo systemctl status v2ray.service

# Check if service is active
sudo systemctl is-active v2ray.service
```

### View Logs
```bash
# View V2Ray logs
sudo journalctl -u v2ray.service -f

# View recent logs
sudo journalctl -u v2ray.service -n 50
```

### Restart Services
```bash
# Restart V2Ray
sudo systemctl restart v2ray.service

# Restart entire system
sudo reboot
```

### Update System
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Update V2Ray (if needed)
sudo bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh)
```

## 📊 Server Configuration

### V2Ray Config Location
```
/etc/v2ray/config.json
```

### Client Configs Location (on server)
```
/root/vless_client_configs/
```

### Service Management
```bash
# Enable V2Ray on boot
sudo systemctl enable v2ray.service

# Disable V2Ray on boot
sudo systemctl disable v2ray.service
```

## 🧪 Testing

### Test Server Connectivity
```bash
# Test WebSocket endpoint
curl -v http://217.142.186.18:443/vless

# Test with timeout
curl --connect-timeout 10 http://217.142.186.18:443/vless
```

### Test from Client
1. Import config into V2Box:
   - **URI method**: Copy URI from `./generate_vless_uris.sh` → V2Box → `+` → `Import v2ray uri from clipboard`
   - **JSON method**: Import JSON file from `~/Downloads/`
2. Enable the connection
3. Check if you can access blocked websites

## 🔒 Security Notes

### Current Security Setup
- **TLS**: Disabled (running on IP only)
- **Authentication**: UUID-based (VLESS protocol)
- **Port**: 443 (standard HTTPS port)
- **Firewall**: Oracle Cloud security groups

### Recommended Security Improvements
1. **Add TLS Certificate**:
   - Get a domain name
   - Run setup script with domain input
   - Enables HTTPS encryption

2. **Firewall Rules**:
   - Ensure only port 443 is open
   - Restrict SSH access to known IPs

3. **Regular Updates**:
   - Keep system packages updated
   - Monitor V2Ray releases

## 🆘 Troubleshooting

### Setup Script Issues
```bash
# Check if script exists
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18 "ls -la /tmp/setup_vless_v2box.sh"

# Run with debugging
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18 "bash -x /tmp/setup_vless_v2box.sh"
```

### Connection Issues
```bash
# Check V2Ray status
sudo systemctl status v2ray.service

# Check logs
sudo journalctl -u v2ray.service -n 20

# Test port connectivity
telnet 217.142.186.18 443
```

### Client Import Issues
- Ensure JSON format is correct
- Check UUID matches server config
- Verify server IP and port

## 💰 Cost Information

### Oracle Cloud Free Tier
- **VM.Standard.A1.Flex**: 2 AMD-based VMs, 1/8 OCPU and 1 GB memory each
- **Always Free**: As long as usage stays within limits
- **Additional Resources**: Pay-as-you-go beyond free tier

### Current Usage
- **Instance**: R2D2-Vless-Server
- **Shape**: VM.Standard.A1.Flex (4 OCPU, 24 GB RAM)
- **OS**: Ubuntu 22.04.1 LTS (aarch64)

## 🔄 Backup and Recovery

### Backup Important Files
```bash
# Backup server config
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18 "sudo cp /etc/v2ray/config.json /root/v2ray-config-backup.json"

# Backup client configs
scp -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18:/root/vless_client_configs/*.json ~/backups/
```

### Recovery
1. If server is lost, create new Oracle instance
2. Upload SSH key and setup script
3. Run setup script with same parameters
4. Import client configs

## 📝 Notes

- **Last Setup**: January 4, 2026
- **V2Ray Version**: Latest available via fhs-install-v2ray
- **Client App**: V2Box (iOS/Android)
- **WebSocket Path**: `/vless`

## 🌐 Web Interface (Frontend)

The project now includes a modern Next.js web interface for managing your VLESS configurations:

### Features
- **Server Monitoring**: Real-time server status and V2Ray service monitoring
- **Config Management**: Create, edit, and delete configurations through a clean UI
- **Ping Testing**: Automatic connectivity testing with color-coded status indicators
- **Export Tools**: One-click VLESS URI copying and JSON config downloads
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Modern UI with dark theme support

### Quick Start
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Architecture
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes handle SSH communication
- **Security**: Direct SSH connection to your VPS (no sensitive data stored)

## 🤝 Contributing

To modify or improve this setup:

1. Edit `setup_vless_v2box.sh` for server changes
2. Update client configs by re-running setup
3. Modify `frontend/` for UI improvements
4. Test thoroughly before deploying
5. Update this README with any changes

---

**Status**: ✅ Server is active and running
**Last Updated**: January 4, 2026
**Maintainer**: Local setup</contents>
</xai:function_call">Write
