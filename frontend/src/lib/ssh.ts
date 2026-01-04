import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { resolve, homedir } from 'path';
import { config } from './config';

export interface SSHResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export class SSHManager {
  private host: string;
  private username: string;
  private privateKeyPath: string;

  constructor() {
    this.host = config.vps.host;
    this.username = config.vps.user;
    this.privateKeyPath = this.resolveKeyPath(config.vps.sshKeyPath);
  }

  private resolveKeyPath(keyPath: string): string {
    // Resolve ~ to home directory
    return keyPath.startsWith('~') ? keyPath.replace('~', homedir()) : resolve(keyPath);
  }

  private async connect(): Promise<Client> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        resolve(conn);
      });

      conn.on('error', (err) => {
        reject(new Error(`SSH connection failed: ${err.message}`));
      });

      try {
        const privateKey = readFileSync(this.privateKeyPath, 'utf8');

        conn.connect({
          host: this.host,
          port: 22,
          username: this.username,
          privateKey: privateKey,
          readyTimeout: 10000, // 10 seconds timeout
        });
      } catch (error) {
        reject(new Error(`Failed to read SSH key: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  private async executeCommand(command: string): Promise<SSHResult> {
    const conn = await this.connect();

    return new Promise((resolve) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          resolve({
            success: false,
            error: `Command execution failed: ${err.message}`,
          });
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code: number) => {
          conn.end();
          resolve({
            success: code === 0,
            stdout,
            stderr,
            error: code !== 0 ? `Command exited with code ${code}` : undefined,
          });
        });

        stream.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      });
    });
  }

  /**
   * Read the V2Ray server configuration
   */
  async readServerConfig(): Promise<SSHResult> {
    const command = `sudo cat ${config.vps.v2rayConfigPath}`;
    return this.executeCommand(command);
  }

  /**
   * Write the V2Ray server configuration
   */
  async writeServerConfig(configJson: string): Promise<SSHResult> {
    // Escape single quotes in the JSON for shell safety
    const escapedJson = configJson.replace(/'/g, "'\\''");
    const command = `echo '${escapedJson}' | sudo tee ${config.vps.v2rayConfigPath} > /dev/null`;
    return this.executeCommand(command);
  }

  /**
   * Restart V2Ray service
   */
  async restartV2Ray(): Promise<SSHResult> {
    const command = 'sudo systemctl restart v2ray.service';
    return this.executeCommand(command);
  }

  /**
   * Check V2Ray service status
   */
  async checkV2RayStatus(): Promise<SSHResult> {
    const command = 'sudo systemctl is-active v2ray.service';
    return this.executeCommand(command);
  }

  /**
   * List client configuration files
   */
  async listClientConfigs(): Promise<SSHResult> {
    const command = `ls -la ${config.vps.clientConfigsPath}/`;
    return this.executeCommand(command);
  }

  /**
   * Read a specific client configuration file
   */
  async readClientConfig(filename: string): Promise<SSHResult> {
    const command = `sudo cat ${config.vps.clientConfigsPath}/${filename}`;
    return this.executeCommand(command);
  }

  /**
   * Write a client configuration file
   */
  async writeClientConfig(filename: string, configJson: string): Promise<SSHResult> {
    // Create directory if it doesn't exist
    const mkdirCommand = `sudo mkdir -p ${config.vps.clientConfigsPath}`;
    await this.executeCommand(mkdirCommand);

    // Write the file
    const escapedJson = configJson.replace(/'/g, "'\\''");
    const command = `echo '${escapedJson}' | sudo tee ${config.vps.clientConfigsPath}/${filename} > /dev/null`;
    return this.executeCommand(command);
  }

  /**
   * Delete a client configuration file
   */
  async deleteClientConfig(filename: string): Promise<SSHResult> {
    const command = `sudo rm -f ${config.vps.clientConfigsPath}/${filename}`;
    return this.executeCommand(command);
  }

  /**
   * Test basic connectivity to the server
   */
  async testConnection(): Promise<SSHResult> {
    const command = 'echo "SSH connection successful"';
    return this.executeCommand(command);
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<SSHResult> {
    const command = 'hostname && uptime && curl -s4 icanhazip.com';
    return this.executeCommand(command);
  }
}

// Export a singleton instance
export const sshManager = new SSHManager();
