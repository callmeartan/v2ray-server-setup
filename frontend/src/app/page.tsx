'use client';

import { useState } from 'react';
import { ServerStatusCard } from '@/components/dashboard/server-status-card';
import { PingTestCard } from '@/components/dashboard/ping-test-card';
import { ConfigCard } from '@/components/dashboard/config-card';
import { UriGenerator } from '@/components/uris/uri-generator';
import { ConfigDownloader } from '@/components/config/config-downloader';
import { Button } from '@/components/ui/button';
import { useServerStatus, useServerConfig, useVlessUris, usePingTest } from '@/lib/hooks';
import { Moon, Sun, Shield, Link, Download } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'status' | 'uris' | 'configs'>('status');
  const [isDark, setIsDark] = useState(false);

  // Data fetching hooks
  const { data: serverStatus, isLoading: statusLoading, refetch: refetchStatus } = useServerStatus();
  const { data: serverConfig, isLoading: configLoading, refetch: refetchConfig } = useServerConfig();
  const { data: uris, isLoading: urisLoading, refetch: refetchUris } = useVlessUris();
  const { data: pingResult, isLoading: pingLoading, refetch: refetchPing } = usePingTest();

  const handleRefreshAll = () => {
    refetchStatus();
    refetchConfig();
    refetchUris();
    refetchPing();
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  VLESS Config Manager
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your Oracle Cloud VLESS VPN server
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                Refresh All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDark(!isDark)}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'status' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('status')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Server Status
          </Button>
          <Button
            variant={activeTab === 'uris' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('uris')}
            className="flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            VLESS URIs
          </Button>
          <Button
            variant={activeTab === 'configs' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('configs')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Config Files
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ServerStatusCard
                status={serverStatus}
                isLoading={statusLoading}
                onRefresh={() => refetchStatus()}
              />
              <PingTestCard
                pingResult={pingResult}
                isLoading={pingLoading}
                onTest={() => refetchPing()}
              />
            </div>
            <div>
              <ConfigCard
                config={serverConfig}
                isLoading={configLoading}
                onRefresh={() => refetchConfig()}
              />
            </div>
          </div>
        )}

        {activeTab === 'uris' && (
          <div className="max-w-4xl">
            <UriGenerator
              uris={uris}
              isLoading={urisLoading}
              onGenerate={(clientNames) => refetchUris()}
            />
          </div>
        )}

        {activeTab === 'configs' && (
          <div className="max-w-4xl">
            <ConfigDownloader config={serverConfig} />
          </div>
        )}
      </div>
    </div>
  );
}