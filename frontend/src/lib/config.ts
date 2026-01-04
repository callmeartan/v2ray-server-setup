// Environment configuration for the VLESS Config Manager

export const config = {
  // VPS Configuration
  vps: {
    host: process.env.VPS_HOST || '217.142.186.18',
    user: process.env.VPS_USER || 'ubuntu',
    sshKeyPath: process.env.SSH_KEY_PATH || '/Users/artan/.ssh/oracle-vless-key.pem',
    v2rayConfigPath: process.env.V2RAY_CONFIG_PATH || '/etc/v2ray/config.json',
    clientConfigsPath: process.env.CLIENT_CONFIGS_PATH || '/root/vless_client_configs',
  },

  // Application Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'VLESS Config Manager',
  },

  // UI Configuration
  ui: {
    pingRefreshInterval: 30000, // 30 seconds
    maxPingTimeout: 5000, // 5 seconds
  },
} as const;
