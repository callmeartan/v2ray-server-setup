import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

const SERVER_IP = process.env.SERVER_IP || '217.142.186.18';
const SSH_KEY = process.env.SSH_KEY || '~/.ssh/oracle-vless-key.pem';
const SSH_USER = process.env.SSH_USER || 'ubuntu';

export async function GET(request: NextRequest) {
  try {
    // Check if SSH key exists
    const sshKeyPath = SSH_KEY.replace('~', process.env.HOME || '/root');
    const fs = require('fs');
    if (!fs.existsSync(sshKeyPath)) {
      return NextResponse.json({
        status: 'error',
        message: 'SSH key not found',
        details: `Key not found at: ${sshKeyPath}`
      }, { status: 500 });
    }

    // Test SSH connection and get server status
    const sshCommand = `ssh -i "${sshKeyPath}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "echo 'SSH OK' && systemctl is-active v2ray.service 2>/dev/null || echo 'inactive'"`;

    const result = execSync(sshCommand, { encoding: 'utf8', timeout: 15000 });

    const lines = result.trim().split('\n');
    const sshOk = lines.includes('SSH OK');
    const v2rayStatus = lines.find(line => line === 'active' || line === 'inactive') || 'unknown';

    // Get additional server info
    const serverInfoCommand = `ssh -i "${sshKeyPath}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "uptime && echo '---' && df -h / | tail -1 && echo '---' && curl -s4 icanhazip.com 2>/dev/null || hostname -I | awk '{print \$1}'"`;

    let serverInfo = '';
    try {
      serverInfo = execSync(serverInfoCommand, { encoding: 'utf8', timeout: 10000 });
    } catch (error) {
      serverInfo = 'Could not retrieve server info';
    }

    const [uptime, diskUsage, currentIP] = serverInfo.split('---').map(s => s.trim());

    return NextResponse.json({
      status: 'success',
      data: {
        sshConnected: sshOk,
        v2rayStatus: v2rayStatus,
        serverIP: SERVER_IP,
        currentIP: currentIP?.trim() || SERVER_IP,
        uptime: uptime?.trim(),
        diskUsage: diskUsage?.trim(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Server status check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check server status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
