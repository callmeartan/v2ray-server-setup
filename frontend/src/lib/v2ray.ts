import { v4 as uuidv4 } from 'uuid';
import {
  VLESSServerConfig,
  VLESSClientConfig,
  ConfigSummary,
  VLESSClient,
  CreateConfigRequest,
} from '@/types/config';
import { config } from './config';

export class V2RayManager {
  /**
   * Parse server configuration JSON string
   */
  parseServerConfig(configJson: string): VLESSServerConfig {
    try {
      return JSON.parse(configJson);
    } catch (error) {
      throw new Error(`Failed to parse server config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate server configuration JSON string
   */
  generateServerConfig(serverConfig: VLESSServerConfig): string {
    try {
      return JSON.stringify(serverConfig, null, 2);
    } catch (error) {
      throw new Error(`Failed to generate server config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract client summaries from server config
   */
  extractClientSummaries(serverConfig: VLESSServerConfig): ConfigSummary[] {
    const clients = serverConfig.inbounds[0]?.settings.clients || [];

    return clients.map((client, index) => {
      const name = client.email.replace('@local', '') || `Client-${index + 1}`;

      return {
        id: client.id,
        name,
        uuid: client.id,
        createdAt: new Date(), // We don't have creation date from server config
        isActive: true,
      };
    });
  }

  /**
   * Generate a new client configuration
   */
  generateClientConfig(
    clientId: string,
    clientName: string,
    serverHost: string,
    serverPort: number = 443,
    useTls: boolean = false
  ): VLESSClientConfig {
    const clientConfig: VLESSClientConfig = {
      log: {},
      inbounds: [
        {
          port: 10808,
          tag: 'socks',
          settings: {
            udp: true,
            userLevel: 8,
            auth: 'noauth',
          },
          listen: '127.0.0.1',
          protocol: 'socks',
        },
        {
          port: 1087,
          tag: 'directSocks',
          settings: {
            udp: true,
            userLevel: 8,
            auth: 'noauth',
          },
          listen: '127.0.0.1',
          protocol: 'socks',
        },
        {
          port: 62789,
          tag: 'api',
          settings: {
            address: '[::1]',
          },
          listen: '[::1]',
          protocol: 'dokodemo-door',
        },
      ],
      outbounds: [
        {
          mux: {
            concurrency: 8,
            enabled: false,
          },
          streamSettings: {
            wsSettings: {
              path: '/vless',
              headers: {
                Host: serverHost,
              },
            },
            network: 'ws',
            security: useTls ? 'tls' : 'none',
          },
          tag: 'proxy',
          settings: {
            vnext: [
              {
                users: [
                  {
                    email: '',
                    level: 0,
                    encryption: 'none',
                    id: clientId,
                    flow: '',
                  },
                ],
                port: serverPort,
                address: serverHost,
              },
            ],
          },
          protocol: 'vless',
        },
        {
          protocol: 'freedom',
          settings: {},
          tag: 'direct',
        },
        {
          protocol: 'blackhole',
          settings: {},
          tag: 'block',
        },
        {
          protocol: 'dns',
          settings: {},
          tag: 'dns-out',
        },
      ],
      api: {
        tag: 'api',
        services: ['StatsService'],
      },
      dns: {
        servers: [
          {
            address: '8.8.8.8',
            skipFallback: false,
          },
        ],
        queryStrategy: 'UseIP',
        tag: 'dnsQuery',
      },
      stats: {},
      routing: {
        domainStrategy: 'AsIs',
        rules: [
          {
            outboundTag: 'api',
            type: 'field',
            inboundTag: ['api'],
          },
          {
            outboundTag: 'direct',
            type: 'field',
            inboundTag: ['directSocks'],
          },
          {
            outboundTag: 'dns-out',
            type: 'field',
            inboundTag: ['dnsQuery'],
          },
        ],
      },
      policy: {
        system: {
          statsInboundUplink: true,
          statsInboundDownlink: true,
        },
        levels: {
          '8': {
            connIdle: 30,
            handshake: 4,
          },
        },
      },
    };

    return clientConfig;
  }

  /**
   * Create a new client and add to server config
   */
  addClientToServerConfig(
    serverConfig: VLESSServerConfig,
    clientName: string
  ): { serverConfig: VLESSServerConfig; clientId: string } {
    const clientId = uuidv4();
    const newClient: VLESSClient = {
      id: clientId,
      alterId: 0,
      email: `${clientName}@local`,
      level: 0,
    };

    // Add client to the first inbound (VLESS inbound)
    if (serverConfig.inbounds[0]?.settings.clients) {
      serverConfig.inbounds[0].settings.clients.push(newClient);
    }

    return { serverConfig, clientId };
  }

  /**
   * Remove a client from server config
   */
  removeClientFromServerConfig(
    serverConfig: VLESSServerConfig,
    clientId: string
  ): VLESSServerConfig {
    if (serverConfig.inbounds[0]?.settings.clients) {
      serverConfig.inbounds[0].settings.clients = serverConfig.inbounds[0].settings.clients.filter(
        client => client.id !== clientId
      );
    }

    return serverConfig;
  }

  /**
   * Generate VLESS URI for client
   */
  generateVLESSUri(
    clientId: string,
    serverHost: string,
    serverPort: number = 443,
    clientName: string,
    useTls: boolean = false
  ): string {
    const baseUri = `vless://${clientId}@${serverHost}:${serverPort}`;
    const params = [
      'type=ws',
      `path=/vless`,
      `host=${serverHost}`,
    ];

    if (useTls) {
      params.unshift('security=tls');
    }

    const queryString = params.join('&');
    const encodedName = encodeURIComponent(clientName);

    return `${baseUri}?${queryString}#${encodedName}`;
  }

  /**
   * Get server host from config (supports TLS and non-TLS)
   */
  getServerHost(serverConfig: VLESSServerConfig): string {
    const inbound = serverConfig.inbounds[0];
    if (!inbound) {
      return config.vps.host; // fallback
    }

    // Check if TLS is enabled and get domain from cert
    if (inbound.streamSettings.security === 'tls' && inbound.streamSettings.tlsSettings) {
      // For TLS configs, we might need to extract domain from cert path or use configured host
      // For now, return configured host
      return config.vps.host;
    }

    // For non-TLS, return configured host
    return config.vps.host;
  }

  /**
   * Get server port from config
   */
  getServerPort(serverConfig: VLESSServerConfig): number {
    return serverConfig.inbounds[0]?.port || 443;
  }

  /**
   * Check if server uses TLS
   */
  serverUsesTls(serverConfig: VLESSServerConfig): boolean {
    return serverConfig.inbounds[0]?.streamSettings.security === 'tls';
  }

  /**
   * Validate server configuration
   */
  validateServerConfig(serverConfig: VLESSServerConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check basic structure
    if (!serverConfig.inbounds || !Array.isArray(serverConfig.inbounds)) {
      errors.push('Server config must have inbounds array');
    }

    if (!serverConfig.outbounds || !Array.isArray(serverConfig.outbounds)) {
      errors.push('Server config must have outbounds array');
    }

    // Check first inbound (VLESS)
    const vlessInbound = serverConfig.inbounds[0];
    if (!vlessInbound) {
      errors.push('Server config must have at least one inbound');
    } else {
      if (vlessInbound.protocol !== 'vless') {
        errors.push('First inbound must be VLESS protocol');
      }

      if (!vlessInbound.settings?.clients || !Array.isArray(vlessInbound.settings.clients)) {
        errors.push('VLESS inbound must have clients array');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate client configuration
   */
  validateClientConfig(clientConfig: VLESSClientConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check basic structure
    if (!clientConfig.inbounds || !Array.isArray(clientConfig.inbounds)) {
      errors.push('Client config must have inbounds array');
    }

    if (!clientConfig.outbounds || !Array.isArray(clientConfig.outbounds)) {
      errors.push('Client config must have outbounds array');
    }

    // Check VLESS outbound
    const vlessOutbound = clientConfig.outbounds.find(out => out.protocol === 'vless');
    if (!vlessOutbound) {
      errors.push('Client config must have VLESS outbound');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export a singleton instance
export const v2rayManager = new V2RayManager();
