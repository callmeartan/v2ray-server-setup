import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

const SERVER_IP = process.env.SERVER_IP || '217.142.186.18';
const SSH_KEY = process.env.SSH_KEY || '~/.ssh/oracle-vless-key.pem';
const SSH_USER = process.env.SSH_USER || 'ubuntu';

// URL encode function
function urlencode(str: string): string {
  return encodeURIComponent(str);
}

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

    // Get custom client names from query params
    const { searchParams } = new URL(request.url);
    const clientNamesParam = searchParams.get('clientNames');
    const customNames = clientNamesParam ? clientNamesParam.split(',') : [];

    // Read server config via SSH
    const configCommand = `ssh -i "${sshKeyPath}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "sudo cat /etc/v2ray/config.json 2>/dev/null"`;

    const serverConfig = execSync(configCommand, { encoding: 'utf8', timeout: 15000 }).trim();

    if (!serverConfig) {
      return NextResponse.json({
        status: 'error',
        message: 'Could not read server config'
      }, { status: 404 });
    }

    // Parse config
    let config;
    try {
      config = JSON.parse(serverConfig);
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid JSON in server config'
      }, { status: 500 });
    }

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

    // Generate URIs for each client
    const uris = clients.map((client: any, index: number) => {
      const uuid = client.id;

      // Determine client name
      let clientName: string;
      if (customNames[index]) {
        clientName = customNames[index].trim();
      } else if (client.email && client.email.includes('@local')) {
        clientName = client.email.replace('@local', '');
      } else {
        clientName = `Client-${index + 1}`;
      }

      // URL encode components
      const pathEncoded = urlencode(path);
      const hostEncoded = urlencode(host);
      const clientNameEncoded = urlencode(clientName);

      // Build URI
      const uri = `vless://${uuid}@${host}:${port}?type=${network}&security=${security}&path=${pathEncoded}&host=${hostEncoded}#${clientNameEncoded}`;

      return {
        name: clientName,
        uri,
        uuid,
        config: {
          port,
          network,
          path,
          security,
          host
        }
      };
    });

    return NextResponse.json({
      status: 'success',
      data: {
        server: {
          ip: SERVER_IP,
          host,
          port
        },
        uris,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('URI generation failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to generate VLESS URIs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
