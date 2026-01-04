# VLESS Server Setup Guide - Oracle Cloud

## Step 1: Wait for Instance to Be Created ⏳

Your instance is currently being created. The work request OCID indicates the creation is in progress.

**Wait 2-5 minutes**, then proceed to Step 2.

---

## Step 2: Get Your Instance Public IP 🌐

1. Go to Oracle Cloud Console
2. Navigate to: **Compute** → **Instances**
3. Find your instance: `R2D2-Vless-Server`
4. Click on the instance name
5. Copy the **Public IP address** (e.g., `123.45.67.89`)

**Save this IP - you'll need it for SSH!**

---

## Step 3: Locate Your Private Key 🔑

You mentioned the key is in the project. Let's find it:

### Option A: If key is in Downloads folder
```bash
# Check Downloads
ls ~/Downloads/*.pem
ls ~/Downloads/*.key
```

### Option B: If key is in project folder
```bash
cd /Users/artan/Desktop/development/VPN-VLESS
ls -la *.pem *.key
```

### Option C: If you saved it with a different name
The key file should have a `.pem` or `.key` extension (no `.pub`).

---

## Step 4: Secure Your Private Key 🔐

Once you find the private key file:

```bash
# Move to .ssh directory (recommended)
mkdir -p ~/.ssh
cp /path/to/your/key.pem ~/.ssh/oracle-vless-key.pem

# Set correct permissions (REQUIRED for SSH)
chmod 600 ~/.ssh/oracle-vless-key.pem
```

**Important:** The `chmod 600` command is REQUIRED - SSH will refuse to use the key otherwise!

---

## Step 5: Test SSH Connection 🧪

Replace `YOUR_PUBLIC_IP` with the IP from Step 2:

```bash
# Test connection (username might be 'ubuntu' or 'opc')
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@YOUR_PUBLIC_IP

# If that doesn't work, try:
ssh -i ~/.ssh/oracle-vless-key.pem opc@YOUR_PUBLIC_IP
```

**First connection tip:** Type `yes` when prompted to accept the host fingerprint.

---

## Step 6: Upload Setup Script 📤

From your Mac terminal (while NOT connected via SSH):

```bash
cd /Users/artan/Desktop/development/VPN-VLESS

# Upload the script (replace YOUR_PUBLIC_IP)
scp -i ~/.ssh/oracle-vless-key.pem setup_vless_v2box.sh ubuntu@YOUR_PUBLIC_IP:/tmp/

# If username is 'opc' instead of 'ubuntu':
scp -i ~/.ssh/oracle-vless-key.pem setup_vless_v2box.sh opc@YOUR_PUBLIC_IP:/tmp/
```

---

## Step 7: Run the Setup Script 🚀

SSH into your server and run the script:

```bash
# Connect to server
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@YOUR_PUBLIC_IP

# Make script executable and run it
sudo chmod +x /tmp/setup_vless_v2box.sh
sudo /tmp/setup_vless_v2box.sh
```

**During setup, you'll be asked:**
- Enter domain name (or leave empty for IP-only setup)

---

## Step 8: Get Your Client Configs 📱

After the script completes:

1. Client configs will be saved in: `/root/vless_client_configs/`
2. Copy them to your Mac:

```bash
# From your Mac (not connected via SSH)
scp -i ~/.ssh/oracle-vless-key.pem ubuntu@YOUR_PUBLIC_IP:/root/vless_client_configs/*.json ~/Downloads/
```

3. Import JSON files into V2Box app on your phone

---

## Troubleshooting 🔧

### SSH Permission Denied
- Make sure key permissions are `600`: `chmod 600 ~/.ssh/oracle-vless-key.pem`
- Check you're using the PRIVATE key (not the .pub file)

### Can't Connect to Server
- Wait a few more minutes - instance might still be booting
- Check Security Lists in Oracle Cloud (port 22 should be open)
- Verify the public IP is correct

### Wrong Username
- Try `ubuntu` first (default for Ubuntu images)
- If that fails, try `opc` (Oracle's default user)

---

## Quick Reference Commands 📝

```bash
# Find your private key
find ~/Downloads -name "*.pem" -o -name "*.key" 2>/dev/null

# Setup key
chmod 600 ~/.ssh/oracle-vless-key.pem

# SSH connect
ssh -i ~/.ssh/oracle-vless-key.pem ubuntu@YOUR_PUBLIC_IP

# Upload script
scp -i ~/.ssh/oracle-vless-key.pem setup_vless_v2box.sh ubuntu@YOUR_PUBLIC_IP:/tmp/

# Download configs
scp -i ~/.ssh/oracle-vless-key.pem ubuntu@YOUR_PUBLIC_IP:/root/vless_client_configs/*.json ~/Downloads/
```

