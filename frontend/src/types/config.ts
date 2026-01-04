// Types for VLESS VPN configurations

export interface VLESSClient {
  id: string; // UUID
  email: string; // Client name (e.g., "Client-1@local")
  level: number;
  alterId: number;
}

export interface VLESSServerConfig {
  log: {
    loglevel: string;
  };
  inbounds: Array<{
    port: number;
    protocol: string;
    settings: {
      clients: VLESSClient[];
      decryption: string;
    };
    streamSettings: {
      network: string;
      security: string;
      wsSettings?: {
        path: string;
        headers?: {
          Host?: string;
        };
      };
      tlsSettings?: {
        certificates: Array<{
          certificateFile: string;
          keyFile: string;
        }>;
      };
    };
  }>;
  outbounds: Array<{
    protocol: string;
    settings: Record<string, any>;
  }>;
}

export interface VLESSClientConfig {
  log: Record<string, any>;
  inbounds: Array<{
    port: number;
    tag: string;
    settings: {
      udp: boolean;
      userLevel: number;
      auth: string;
    };
    listen: string;
    protocol: string;
  }>;
  outbounds: Array<{
    mux: {
      concurrency: number;
      enabled: boolean;
    };
    streamSettings: {
      wsSettings: {
        path: string;
        headers: {
          Host: string;
        };
      };
      network: string;
      security: string;
    };
    tag: string;
    settings: {
      vnext: Array<{
        users: Array<{
          email: string;
          level: number;
          encryption: string;
          id: string;
          flow: string;
        }>;
        port: number;
        address: string;
      }>;
    };
    protocol: string;
  }>;
  api: {
    tag: string;
    services: string[];
  };
  dns: {
    servers: Array<{
      address: string;
      skipFallback: boolean;
    }>;
    queryStrategy: string;
    tag: string;
  };
  stats: Record<string, any>;
  routing: {
    domainStrategy: string;
    rules: Array<{
      outboundTag: string;
      type: string;
      inboundTag?: string[];
    }>;
  };
  policy: {
    system: {
      statsInboundUplink: boolean;
      statsInboundDownlink: boolean;
    };
    levels: Record<string, {
      connIdle: number;
      handshake: number;
    }>;
  };
}

export interface ConfigSummary {
  id: string;
  name: string;
  uuid: string;
  createdAt: Date;
  lastUsed?: Date;
  ping?: number; // in milliseconds
  isActive: boolean;
}

export interface PingResult {
  configId: string;
  latency: number; // in milliseconds
  success: boolean;
  timestamp: Date;
  error?: string;
}

export interface ServerStatus {
  isOnline: boolean;
  v2rayRunning: boolean;
  lastChecked: Date;
  ip: string;
  port: number;
  clientCount: number;
}

export interface CreateConfigRequest {
  name: string;
  notes?: string;
}

export interface UpdateConfigRequest {
  name?: string;
  notes?: string;
}
