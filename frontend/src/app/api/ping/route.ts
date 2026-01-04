import { NextRequest, NextResponse } from 'next/server';
import { pingManager } from '@/lib/ping';
import { PingResult } from '@/types/config';

// POST /api/ping - Test connectivity for configurations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both single config and multiple configs
    if (body.configId && body.host) {
      // Single config ping
      const result = await pingManager.pingHost({
        host: body.host,
        port: body.port || 443,
        timeout: body.timeout,
        count: body.count,
      });

      return NextResponse.json({
        ...result,
        configId: body.configId,
      });
    } else if (body.configs && Array.isArray(body.configs)) {
      // Multiple configs ping
      const results = await pingManager.pingMultipleConfigs(body.configs);

      return NextResponse.json({ results });
    } else {
      return NextResponse.json(
        { error: 'Invalid request: provide either single config (configId, host) or configs array' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing ping:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/ping - Get ping statistics for server
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('host') || '217.142.186.18';
    const samples = parseInt(searchParams.get('samples') || '5', 10);

    const stats = await pingManager.getPingStats(host, samples);

    return NextResponse.json({
      host,
      stats,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting ping stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
