import { NextRequest, NextResponse } from 'next/server';
import { sshManager } from '@/lib/ssh';
import { v2rayManager } from '@/lib/v2ray';
import { ConfigSummary, CreateConfigRequest } from '@/types/config';

// GET /api/configs - Fetch all client configurations
export async function GET() {
  try {
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

    // Extract client summaries
    const configs: ConfigSummary[] = v2rayManager.extractClientSummaries(serverConfig);

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching configs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/configs - Create a new client configuration
export async function POST(request: NextRequest) {
  try {
    const body: CreateConfigRequest = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: name is required and must be a string' },
        { status: 400 }
      );
    }

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

    // Get server details
    const serverHost = v2rayManager.getServerHost(serverConfig);
    const serverPort = v2rayManager.getServerPort(serverConfig);
    const useTls = v2rayManager.serverUsesTls(serverConfig);

    // Add new client to server config
    const { serverConfig: updatedServerConfig, clientId } = v2rayManager.addClientToServerConfig(
      serverConfig,
      body.name
    );

    // Generate client config
    const clientConfig = v2rayManager.generateClientConfig(
      clientId,
      body.name,
      serverHost,
      serverPort,
      useTls
    );

    // Validate configs
    const serverValidation = v2rayManager.validateServerConfig(updatedServerConfig);
    const clientValidation = v2rayManager.validateClientConfig(clientConfig);

    if (!serverValidation.valid) {
      return NextResponse.json(
        { error: 'Server config validation failed', details: serverValidation.errors },
        { status: 400 }
      );
    }

    if (!clientValidation.valid) {
      return NextResponse.json(
        { error: 'Client config validation failed', details: clientValidation.errors },
        { status: 400 }
      );
    }

    // Write updated server config
    const serverConfigJson = v2rayManager.generateServerConfig(updatedServerConfig);
    const writeServerResult = await sshManager.writeServerConfig(serverConfigJson);

    if (!writeServerResult.success) {
      return NextResponse.json(
        { error: 'Failed to update server config', details: writeServerResult.error },
        { status: 500 }
      );
    }

    // Write client config file
    const clientConfigJson = JSON.stringify(clientConfig, null, 2);
    const clientFilename = `${body.name}.json`;
    const writeClientResult = await sshManager.writeClientConfig(clientFilename, clientConfigJson);

    if (!writeClientResult.success) {
      return NextResponse.json(
        { error: 'Failed to save client config', details: writeClientResult.error },
        { status: 500 }
      );
    }

    // Restart V2Ray service
    const restartResult = await sshManager.restartV2Ray();

    if (!restartResult.success) {
      console.warn('V2Ray restart failed:', restartResult.error);
      // Don't fail the request, but log the warning
    }

    // Create config summary
    const configSummary: ConfigSummary = {
      id: clientId,
      name: body.name,
      uuid: clientId,
      createdAt: new Date(),
      isActive: true,
    };

    return NextResponse.json({
      config: configSummary,
      message: 'Configuration created successfully',
    });
  } catch (error) {
    console.error('Error creating config:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
