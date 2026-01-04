import { NextResponse } from 'next/server';
import { sshManager } from '@/lib/ssh';
import { v2rayManager } from '@/lib/v2ray';
import { ServerStatus } from '@/types/config';

// GET /api/server - Get server status and information
export async function GET() {
  try {
    // Test SSH connection
    const connectionTest = await sshManager.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        isOnline: false,
        v2rayRunning: false,
        lastChecked: new Date(),
        error: 'SSH connection failed',
      } as ServerStatus);
    }

    // Check V2Ray status
    const v2rayStatus = await sshManager.checkV2RayStatus();
    const v2rayRunning = v2rayStatus.success && v2rayStatus.stdout?.trim() === 'active';

    // Get server info
    const serverInfo = await sshManager.getServerInfo();
    let ip = '217.142.186.18'; // fallback
    let hostname = 'unknown';

    if (serverInfo.success && serverInfo.stdout) {
      const lines = serverInfo.stdout.split('\n');
      hostname = lines[0] || 'unknown';
      // Try to extract IP from the output
      const ipMatch = serverInfo.stdout.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) {
        ip = ipMatch[1];
      }
    }

    // Read server config to get client count and port
    let clientCount = 0;
    let port = 443;

    try {
      const serverConfigResult = await sshManager.readServerConfig();
      if (serverConfigResult.success) {
        const serverConfig = v2rayManager.parseServerConfig(serverConfigResult.stdout!);
        const clients = serverConfig.inbounds[0]?.settings.clients || [];
        clientCount = clients.length;
        port = serverConfig.inbounds[0]?.port || 443;
      }
    } catch (error) {
      console.warn('Failed to read server config for stats:', error);
    }

    const serverStatus: ServerStatus = {
      isOnline: true,
      v2rayRunning,
      lastChecked: new Date(),
      ip,
      port,
      clientCount,
      hostname,
    };

    return NextResponse.json(serverStatus);
  } catch (error) {
    console.error('Error getting server status:', error);
    return NextResponse.json(
      {
        isOnline: false,
        v2rayRunning: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ServerStatus,
      { status: 500 }
    );
  }
}
