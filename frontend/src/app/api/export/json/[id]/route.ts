import { NextRequest, NextResponse } from 'next/server';
import { sshManager } from '@/lib/ssh';
import { v2rayManager } from '@/lib/v2ray';

// GET /api/export/json/[id] - Generate JSON config for a configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;

    // Read server config
    const serverConfigResult = await sshManager.readServerConfig();

    if (!serverConfigResult.success) {
      return NextResponse.json(
        { error: 'Failed to read server config', details: serverConfigResult.error },
        { status: 500 }
      );
    }

    // Parse server config
    const serverConfig = v2rayManager.parseServerConfig(serverConfigResult.stdout!);

    // Find the client
    const clients = serverConfig.inbounds[0]?.settings.clients || [];
    const client = clients.find(c => c.id === configId);

    if (!client) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Get server details
    const serverHost = v2rayManager.getServerHost(serverConfig);
    const serverPort = v2rayManager.getServerPort(serverConfig);
    const useTls = v2rayManager.serverUsesTls(serverConfig);
    const clientName = client.email.replace('@local', '');

    // Generate client config
    const clientConfig = v2rayManager.generateClientConfig(
      configId,
      clientName,
      serverHost,
      serverPort,
      useTls
    );

    // Convert to JSON string
    const jsonConfig = JSON.stringify(clientConfig, null, 2);

    // Return as downloadable file
    return new Response(jsonConfig, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${clientName}.json"`,
      },
    });
  } catch (error) {
    console.error('Error generating JSON config:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
