import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

const SERVER_IP = process.env.SERVER_IP || '217.142.186.18';

export async function GET() {
  try {
    const results: {
      serverIP: string;
      tests: Array<{
        name: string;
        type: string;
        success: boolean;
        details: string;
        error?: string;
        latency?: string;
        response?: string;
      }>;
      overall: {
        status: string;
        score: string;
        percentage: number;
      };
      timestamp: string;
    } = {
      serverIP: SERVER_IP,
      tests: [],
      overall: {
        status: 'unknown',
        score: '0/0',
        percentage: 0
      },
      timestamp: new Date().toISOString()
    };

    // Basic connectivity test
    try {
      const pingCommand = `ping -c 3 -W 2 ${SERVER_IP}`;
      const pingResult = execSync(pingCommand, { encoding: 'utf8', timeout: 10000 });

      const pingLines = pingResult.split('\n');
      const statsLine = pingLines.find(line => line.includes('packets transmitted'));

      if (statsLine) {
        const match = statsLine.match(/(\d+) packets transmitted, (\d+) received/);
        if (match) {
          results.tests.push({
            name: 'Basic Ping',
            type: 'ping',
            success: true,
            details: `${match[2]}/${match[1]} packets received`,
            latency: pingLines.find(line => line.includes('round-trip')) || 'Unknown'
          });
        }
      }
    } catch (error) {
      results.tests.push({
        name: 'Basic Ping',
        type: 'ping',
        success: false,
        details: 'Failed to ping server',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // WebSocket endpoint test
    try {
      const wsTestCommand = `curl -I --connect-timeout 10 --max-time 15 http://${SERVER_IP}:443/vless`;
      const wsResult = execSync(wsTestCommand, { encoding: 'utf8', timeout: 20000 });

      const hasResponse = wsResult.includes('HTTP/') || wsResult.length > 0;
      results.tests.push({
        name: 'WebSocket Endpoint',
        type: 'websocket',
        success: hasResponse,
        details: hasResponse ? 'Endpoint reachable' : 'Endpoint not responding',
        response: wsResult.split('\n')[0] || 'No response'
      });
    } catch (error) {
      results.tests.push({
        name: 'WebSocket Endpoint',
        type: 'websocket',
        success: false,
        details: 'WebSocket endpoint unreachable',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Port 443 connectivity test
    try {
      const portTestCommand = `nc -z -w5 ${SERVER_IP} 443 && echo "Port open" || echo "Port closed"`;
      const portResult = execSync(portTestCommand, { encoding: 'utf8', timeout: 10000 });

      results.tests.push({
        name: 'Port 443',
        type: 'port',
        success: portResult.includes('Port open'),
        details: portResult.trim()
      });
    } catch (error) {
      results.tests.push({
        name: 'Port 443',
        type: 'port',
        success: false,
        details: 'Port test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Calculate overall status
    const successfulTests = results.tests.filter(test => test.success).length;
    const totalTests = results.tests.length;

    results.overall = {
      status: successfulTests === totalTests ? 'healthy' : successfulTests > 0 ? 'warning' : 'error',
      score: `${successfulTests}/${totalTests}`,
      percentage: Math.round((successfulTests / totalTests) * 100)
    };

    return NextResponse.json({
      status: 'success',
      data: results
    });

  } catch (error) {
    console.error('Ping test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to run connectivity tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}