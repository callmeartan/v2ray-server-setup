# Quick Start - VLESS Server Setup

## ✅ Current Status

- **Instance**: R2D2-Vless-Server (Running)
- **Public IP**: `217.142.186.18`
- **OS**: Ubuntu 22.04.1 LTS
- **Username**: `ubuntu`
- **SSH Key**: `~/.ssh/oracle-vless-key.pem`
- **Setup Script**: Uploaded to `/tmp/setup_vless_v2box.sh`

---

## 🚀 Run the Setup Script

### Step 1: SSH into your server

```bash
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18
```

### Step 2: Run the setup script

```bash
sudo /tmp/setup_vless_v2box.sh
```

### Step 3: Follow the prompts

The script will ask:
- **Domain name**: Enter your domain (e.g., `example.com`) OR leave empty for IP-only setup
  - If you have a domain: Enter it (the script will set up TLS/SSL)
  - If you don't have a domain: Just press Enter (uses IP address only)

---

## ⏱️ Setup Time

The script takes approximately **3-5 minutes** to complete. It will:
1. Update system packages
2. Install V2Ray and dependencies
3. Generate 3 client configurations
4. Set up the VLESS server
5. Display QR codes for easy import

---

## 📱 After Setup Completes

### Get Client Config Files

After the script finishes, download the client configs to your Mac:

```bash
# From your Mac (not SSH'd into server)
scp -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18:/root/vless_client_configs/*.json ~/Downloads/
```

### Import into V2Box

1. Transfer JSON files to your phone
2. Open V2Box app
3. Tap `+` → `Import` → Select JSON file
4. Enable the connection
5. Connect!

---

## 🔧 Useful Commands

### SSH into server
```bash
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@217.142.186.18
```

### Check V2Ray status
```bash
sudo systemctl status v2ray.service
```

### View V2Ray logs
```bash
sudo journalctl -u v2ray.service -f
```

### Restart V2Ray
```bash
sudo systemctl restart v2ray.service
```

### View server config
```bash
sudo cat /etc/v2ray/config.json
```

---

## 🧪 Test Your Server

### Test WebSocket endpoint
```bash
curl -v http://217.142.186.18:443/vless
```

(If you set up TLS, use `https://` instead)

---

## 📍 Quick Reference

- **Server IP**: `217.142.186.18`
- **Port**: `443`
- **Path**: `/vless`
- **Config Location**: `/root/vless_client_configs/`
- **Server Config**: `/etc/v2ray/config.json`

---

## ❓ Troubleshooting

### Script fails to run
- Make sure you're using `sudo`
- Check internet connection on the server

### Can't connect after setup
- Verify V2Ray is running: `sudo systemctl status v2ray.service`
- Check firewall rules in Oracle Cloud Console
- Review logs: `sudo journalctl -u v2ray.service -n 50`

### Need to regenerate client configs
- Run the setup script again (it will overwrite existing configs)
- Or manually edit `/etc/v2ray/config.json` and restart V2Ray

