import { NextRequest, NextResponse } from 'next/server';
import { sshManager } from '@/lib/ssh';
import { v2rayManager } from '@/lib/v2ray';
import { ConfigSummary, UpdateConfigRequest } from '@/types/config';

// GET /api/configs/[id] - Fetch a specific client configuration
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

    // Generate client config
    const clientName = client.email.replace('@local', '');
    const clientConfig = v2rayManager.generateClientConfig(
      configId,
      clientName,
      serverHost,
      serverPort,
      useTls
    );

    // Create config summary
    const configSummary: ConfigSummary = {
      id: configId,
      name: clientName,
      uuid: configId,
      createdAt: new Date(), // We don't have creation date
      isActive: true,
    };

    return NextResponse.json({
      config: configSummary,
      clientConfig,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/configs/[id] - Update a client configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    const body: UpdateConfigRequest = await request.json();

    // Read current server config
    const serverConfigResult = await sshManager.readServerConfig();

    if (!serverConfigResult.success) {
      return NextResponse.json(
        { error: 'Failed to read server config', details: serverConfigResult.error },
        { status: 500 }
      );
    }

    // Parse server config
    let serverConfig = v2rayManager.parseServerConfig(serverConfigResult.stdout!);

    // Find and update the client
    const clients = serverConfig.inbounds[0]?.settings.clients || [];
    const clientIndex = clients.findIndex(c => c.id === configId);

    if (clientIndex === -1) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Update client name if provided
    if (body.name) {
      clients[clientIndex].email = `${body.name}@local`;
    }

    // Regenerate client config file if name changed
    if (body.name) {
      const serverHost = v2rayManager.getServerHost(serverConfig);
      const serverPort = v2rayManager.getServerPort(serverConfig);
      const useTls = v2rayManager.serverUsesTls(serverConfig);

      const clientConfig = v2rayManager.generateClientConfig(
        configId,
        body.name,
        serverHost,
        serverPort,
        useTls
      );

      // Delete old client config file
      const oldClientName = clients[clientIndex].email.replace('@local', '');
      const oldFilename = `${oldClientName}.json`;
      await sshManager.deleteClientConfig(oldFilename);

      // Write new client config file
      const clientConfigJson = JSON.stringify(clientConfig, null, 2);
      const newFilename = `${body.name}.json`;
      const writeResult = await sshManager.writeClientConfig(newFilename, clientConfigJson);

      if (!writeResult.success) {
        return NextResponse.json(
          { error: 'Failed to update client config file', details: writeResult.error },
          { status: 500 }
        );
      }
    }

    // Write updated server config
    const serverConfigJson = v2rayManager.generateServerConfig(serverConfig);
    const writeServerResult = await sshManager.writeServerConfig(serverConfigJson);

    if (!writeServerResult.success) {
      return NextResponse.json(
        { error: 'Failed to update server config', details: writeServerResult.error },
        { status: 500 }
      );
    }

    // Restart V2Ray service
    const restartResult = await sshManager.restartV2Ray();

    if (!restartResult.success) {
      console.warn('V2Ray restart failed:', restartResult.error);
    }

    // Create updated config summary
    const client = clients[clientIndex];
    const configSummary: ConfigSummary = {
      id: configId,
      name: client.email.replace('@local', ''),
      uuid: configId,
      createdAt: new Date(),
      isActive: true,
    };

    return NextResponse.json({
      config: configSummary,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/configs/[id] - Delete a client configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;

    // Read current server config
    const serverConfigResult = await sshManager.readServerConfig();

    if (!serverConfigResult.success) {
      return NextResponse.json(
        { error: 'Failed to read server config', details: serverConfigResult.error },
        { status: 500 }
      );
    }

    // Parse server config
    let serverConfig = v2rayManager.parseServerConfig(serverConfigResult.stdout!);

    // Find the client
    const clients = serverConfig.inbounds[0]?.settings.clients || [];
    const clientIndex = clients.findIndex(c => c.id === configId);

    if (clientIndex === -1) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    const client = clients[clientIndex];
    const clientName = client.email.replace('@local', '');

    // Remove client from server config
    serverConfig = v2rayManager.removeClientFromServerConfig(serverConfig, configId);

    // Write updated server config
    const serverConfigJson = v2rayManager.generateServerConfig(serverConfig);
    const writeServerResult = await sshManager.writeServerConfig(serverConfigJson);

    if (!writeServerResult.success) {
      return NextResponse.json(
        { error: 'Failed to update server config', details: writeServerResult.error },
        { status: 500 }
      );
    }

    // Delete client config file
    const filename = `${clientName}.json`;
    const deleteResult = await sshManager.deleteClientConfig(filename);

    if (!deleteResult.success) {
      console.warn('Failed to delete client config file:', deleteResult.error);
      // Don't fail the request, but log the warning
    }

    // Restart V2Ray service
    const restartResult = await sshManager.restartV2Ray();

    if (!restartResult.success) {
      console.warn('V2Ray restart failed:', restartResult.error);
    }

    return NextResponse.json({
      message: 'Configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
