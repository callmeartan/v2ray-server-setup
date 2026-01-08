# 🔄 How to Change Your Oracle Cloud Server IP

If your IP address `217.142.186.18` is blocked by your ISP, you need to request a new one from Oracle Cloud. 

**I cannot do this for you** because it requires access to the Oracle Cloud Web Console (the website), not just the server terminal.

Follow these steps to get a new clean IP address in ~2 minutes.

---

### Step 1: Open Oracle Cloud Console
1. Log in to [cloud.oracle.com](https://cloud.oracle.com).
2. Go to **Compute** → **Instances**.
3. Click on your instance name (e.g., `vless-server`).

### Step 2: Detach the Old IP
1. Scroll down to the **Resources** menu on the left (or bottom).
2. Click **Attached VNICs**.
3. Click the name of the VNIC (usually `vless-vnic` or the instance name).
4. Under **Resources**, click **IPv4 Addresses**.
5. Click the **Enable/Disable** menu (three dots) on the right of your Primary IP.
6. Select **Edit**.
7. Choose **No Public IP**.
8. Click **Update**.
   * *(Your server is now offline for a moment)*.

### Step 3: Get a New IP
1. Wait 10 seconds.
2. Click the three dots on the same row again → **Edit**.
3. Select **Ephemeral Public IP**.
4. Click **Update**.
5. **🎉 Success!** A new specific IP address will appear in the "Public IP Address" column.

---

### Step 4: Update Your Setup
Once you have the new IP (e.g., `123.45.67.89`), tell me the new IP or run the following command in your terminal to generate new links explicitly:

```bash
# Replace 123.45.67.89 with your NEW IP
SERVER_IP=123.45.67.89 ./generate_vless_links.sh
```

**Note:** You may need to accept the new SSH fingerprint when you connect for the first time.
