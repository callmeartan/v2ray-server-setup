import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

const SERVER_IP = process.env.SERVER_IP || '217.142.186.18';
const SSH_KEY = process.env.SSH_KEY || '~/.ssh/oracle-vless-key.pem';
const SSH_USER = process.env.SSH_USER || 'ubuntu';
const REMOTE_PATH = '/root/vless_client_configs';

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

    // Get client index from query params
    const { searchParams } = new URL(request.url);
    const clientIndex = parseInt(searchParams.get('client') || '0');

    // First check what configs are available
    const listCommand = `ssh -i "${sshKeyPath}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "ls -1 ${REMOTE_PATH}/*.json 2>/dev/null || echo 'none'"`;

    const availableConfigs = execSync(listCommand, { encoding: 'utf8', timeout: 10000 }).trim();

    if (availableConfigs === 'none' || !availableConfigs) {
      return NextResponse.json({
        status: 'error',
        message: 'No client configs found on server'
      }, { status: 404 });
    }

    const configFiles = availableConfigs.split('\n').filter(f => f.trim());
    const configFile = configFiles[clientIndex];

    if (!configFile) {
      return NextResponse.json({
        status: 'error',
        message: `Client config ${clientIndex} not found. Available: ${configFiles.length} configs`
      }, { status: 404 });
    }

    // Download the config file
    const downloadCommand = `ssh -i "${sshKeyPath}" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "${SSH_USER}@${SERVER_IP}" "sudo cat ${configFile} 2>/dev/null"`;

    const configContent = execSync(downloadCommand, { encoding: 'utf8', timeout: 15000 }).trim();

    if (!configContent) {
      return NextResponse.json({
        status: 'error',
        message: 'Could not read client config'
      }, { status: 500 });
    }

    // Extract filename from path
    const filename = configFile.split('/').pop() || `client-${clientIndex}.json`;

    return new NextResponse(configContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Config download failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to download client config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
