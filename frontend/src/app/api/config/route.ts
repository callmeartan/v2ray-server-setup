import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

const SERVER_IP = process.env.SERVER_IP || '217.142.186.18';
const SSH_KEY = process.env.SSH_KEY || '~/.ssh/oracle-vless-key.pem';
const SSH_USER = process.env.SSH_USER || 'ubuntu';
const CONFIG_PATH = '/etc/v2ray/config.json';

export async function GET(request: NextRequest) {
  try {
    // Check if SSH key exists
    const sshKeyPath = SSH_KEY.replace('~', process.env.HOME || '/root');
    const fs = require('fs');
    if (!fs.existsSync(sshKeyPath)) {
      return NextResponse.json({
        status: 'error',
        message: 'SSH key not found'
      }, { status: 500 });
    }

    // Read server config via SSH
    const sshCommand = `ssh -i "${sshKeyPath}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "sudo cat ${CONFIG_PATH} 2>/dev/null"`;

    const serverConfig = execSync(sshCommand, { encoding: 'utf8', timeout: 15000 }).trim();

    if (!serverConfig) {
      return NextResponse.json({
        status: 'error',
        message: 'Could not read server config'
      }, { status: 404 });
    }

    // Parse the JSON config
    let config;
    try {
      config = JSON.parse(serverConfig);
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid JSON in server config'
      }, { status: 500 });
    }

    // Extract relevant information
    const inbound = config.inbounds?.[0];
    if (!inbound) {
      return NextResponse.json({
        status: 'error',
        message: 'No inbound configuration found'
      }, { status: 500 });
    }

    const clients = inbound.settings?.clients || [];
    const port = inbound.port;
    const network = inbound.streamSettings?.network || 'ws';
    const path = inbound.streamSettings?.wsSettings?.path || '/vless';
    const security = inbound.streamSettings?.security || 'none';
    const host = inbound.streamSettings?.wsSettings?.headers?.Host || SERVER_IP;

    return NextResponse.json({
      status: 'success',
      data: {
        port,
        network,
        path,
        security,
        host,
        clients: clients.map((client: any, index: number) => ({
          id: client.id,
          email: client.email || `Client-${index + 1}@local`,
          level: client.level || 0,
          name: client.email?.replace('@local', '') || `Client-${index + 1}`
        })),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Config read failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to read server config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
