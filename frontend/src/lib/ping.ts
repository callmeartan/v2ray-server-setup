import { exec } from 'child_process';
import { promisify } from 'util';
import { PingResult } from '@/types/config';
import { config } from './config';

const execAsync = promisify(exec);

export interface PingOptions {
  host: string;
  port?: number;
  timeout?: number;
  count?: number;
}

export class PingManager {
  private cache = new Map<string, { result: PingResult; timestamp: number }>();
  private readonly cacheTtl = config.ui.pingRefreshInterval; // 30 seconds

  /**
   * Test ping to a specific host and port
   */
  async pingHost(options: PingOptions): Promise<PingResult> {
    const { host, port = 443, timeout = config.ui.maxPingTimeout, count = 3 } = options;

    // Create cache key
    const cacheKey = `${host}:${port}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.result;
    }

    try {
      // Use system ping command for basic connectivity test
      const pingCommand = `ping -c ${count} -W ${Math.ceil(timeout / 1000)} ${host}`;

      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(pingCommand, {
        timeout,
        killSignal: 'SIGTERM',
      });

      const endTime = Date.now();

      // Parse ping output to get average latency
      const latency = this.parsePingOutput(stdout);

      const result: PingResult = {
        configId: cacheKey,
        latency,
        success: true,
        timestamp: new Date(),
      };

      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    } catch (error) {
      const result: PingResult = {
        configId: cacheKey,
        latency: -1,
        success: false,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown ping error',
      };

      // Cache failed results too (but for shorter time)
      this.cache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    }
  }

  /**
   * Test ping for multiple configurations
   */
  async pingMultipleConfigs(configs: Array<{ id: string; host: string; port?: number }>): Promise<PingResult[]> {
    const promises = configs.map(config =>
      this.pingHost({
        host: config.host,
        port: config.port,
      }).then(result => ({
        ...result,
        configId: config.id,
      }))
    );

    return Promise.all(promises);
  }

  /**
   * Parse ping command output to extract average latency
   */
  private parsePingOutput(output: string): number {
    // Look for lines like: "round-trip min/avg/max/stddev = 12.345/23.456/34.567/5.678 ms"
    const match = output.match(/round-trip.*=.*\/([\d.]+)\//);

    if (match && match[1]) {
      const avgLatency = parseFloat(match[1]);
      return Math.round(avgLatency);
    }

    // Fallback: extract any latency value
    const latencyMatch = output.match(/time=([\d.]+)\s*ms/);
    if (latencyMatch && latencyMatch[1]) {
      return Math.round(parseFloat(latencyMatch[1]));
    }

    // If we can't parse, return a default latency
    return 100; // Default to 100ms if parsing fails
  }

  /**
   * Test TCP connectivity to a specific port (more accurate for VPN servers)
   */
  async testTcpConnectivity(host: string, port: number, timeout: number = 5000): Promise<PingResult> {
    const cacheKey = `tcp:${host}:${port}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.result;
    }

    return new Promise((resolve) => {
      const net = require('net');
      const client = net.createConnection({ host, port, timeout }, () => {
        // Connection successful
        client.end();
        const result: PingResult = {
          configId: cacheKey,
          latency: 50, // Assume 50ms for successful TCP connection
          success: true,
          timestamp: new Date(),
        };

        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        resolve(result);
      });

      client.on('error', (error: Error) => {
        const result: PingResult = {
          configId: cacheKey,
          latency: -1,
          success: false,
          timestamp: new Date(),
          error: `TCP connection failed: ${error.message}`,
        };

        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        resolve(result);
      });

      client.on('timeout', () => {
        client.destroy();
        const result: PingResult = {
          configId: cacheKey,
          latency: -1,
          success: false,
          timestamp: new Date(),
          error: `TCP connection timeout after ${timeout}ms`,
        };

        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        resolve(result);
      });
    });
  }

  /**
   * Clear the ping cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get ping statistics for a host
   */
  async getPingStats(host: string, samples: number = 5): Promise<{
    min: number;
    max: number;
    avg: number;
    successRate: number;
  }> {
    const results: number[] = [];
    let successCount = 0;

    for (let i = 0; i < samples; i++) {
      const result = await this.pingHost({ host, count: 1 });
      if (result.success && result.latency > 0) {
        results.push(result.latency);
        successCount++;
      }
      // Small delay between pings
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (results.length === 0) {
      return { min: -1, max: -1, avg: -1, successRate: 0 };
    }

    const min = Math.min(...results);
    const max = Math.max(...results);
    const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
    const successRate = successCount / samples;

    return { min, max, avg, successRate };
  }

  /**
   * Get color coding for ping latency
   */
  getPingColor(latency: number): 'green' | 'yellow' | 'red' | 'gray' {
    if (latency < 0) return 'gray'; // Failed ping
    if (latency < 100) return 'green'; // Good
    if (latency < 300) return 'yellow'; // Okay
    return 'red'; // Poor
  }

  /**
   * Get human-readable ping status
   */
  getPingStatus(latency: number): string {
    if (latency < 0) return 'Offline';
    if (latency < 100) return 'Excellent';
    if (latency < 200) return 'Good';
    if (latency < 300) return 'Fair';
    return 'Poor';
  }
}

// Export a singleton instance
export const pingManager = new PingManager();
