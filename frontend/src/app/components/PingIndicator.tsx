'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { pingManager } from '@/lib/ping';
import { PingResult } from '@/types/config';

interface PingIndicatorProps {
  configId: string;
  host: string;
  port?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export default function PingIndicator({
  configId,
  host,
  port = 443,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = '',
}: PingIndicatorProps) {
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testPing = async () => {
    setIsLoading(true);
    try {
      const result = await pingManager.pingHost({ host, port });
      setPingResult(result);
    } catch (error) {
      console.error('Ping test failed:', error);
      setPingResult({
        configId,
        latency: -1,
        success: false,
        timestamp: new Date(),
        error: 'Ping test failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial ping test
    testPing();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(testPing, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [host, port, autoRefresh, refreshInterval]);

  const getPingColor = (latency: number): string => {
    if (latency < 0) return 'text-gray-400';
    if (latency < 100) return 'text-green-500';
    if (latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPingIcon = (latency: number) => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (latency < 0) return <WifiOff className="h-4 w-4 text-gray-400" />;
    return <Wifi className={`h-4 w-4 ${getPingColor(latency)}`} />;
  };

  const getPingText = (latency: number): string => {
    if (isLoading) return 'Testing...';
    if (latency < 0) return 'Offline';
    if (latency < 100) return `${latency}ms`;
    if (latency < 300) return `${latency}ms`;
    return `${latency}ms`;
  };

  const getPingStatus = (latency: number): string => {
    if (latency < 0) return 'offline';
    if (latency < 100) return 'excellent';
    if (latency < 200) return 'good';
    if (latency < 300) return 'fair';
    return 'poor';
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 ${className}`}
      title={`Ping status: ${getPingStatus(pingResult?.latency || -1)}`}
    >
      {getPingIcon(pingResult?.latency || -1)}
      <span className={getPingColor(pingResult?.latency || -1)}>
        {getPingText(pingResult?.latency || -1)}
      </span>
    </div>
  );
}
