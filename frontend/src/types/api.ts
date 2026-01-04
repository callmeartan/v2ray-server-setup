export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  details?: string;
}

export interface ServerStatus {
  sshConnected: boolean;
  v2rayStatus: 'active' | 'inactive' | 'unknown';
  serverIP: string;
  currentIP: string;
  uptime?: string;
  diskUsage?: string;
  timestamp: string;
}

export interface VlessClient {
  id: string;
  email: string;
  level: number;
  name: string;
}

export interface ServerConfig {
  port: number;
  network: string;
  path: string;
  security: string;
  host: string;
  clients: VlessClient[];
  timestamp: string;
}

export interface VlessUri {
  name: string;
  uri: string;
  uuid: string;
  config: {
    port: number;
    network: string;
    path: string;
    security: string;
    host: string;
  };
}

export interface UriResponse {
  server: {
    ip: string;
    host: string;
    port: number;
  };
  uris: VlessUri[];
  timestamp: string;
}

export interface PingTest {
  name: string;
  type: 'ping' | 'websocket' | 'port';
  success: boolean;
  details: string;
  error?: string;
  latency?: string;
  response?: string;
}

export interface PingResult {
  serverIP: string;
  tests: PingTest[];
  overall: {
    status: 'healthy' | 'warning' | 'error';
    score: string;
    percentage: number;
  };
  timestamp: string;
}
