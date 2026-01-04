'use client';

import { useState, useEffect } from 'react';
import { Server, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfigSummary, ServerStatus, CreateConfigRequest, UpdateConfigRequest } from '@/types/config';
import ConfigList from './components/ConfigList';
import ConfigEditor from './components/ConfigEditor';

export default function Home() {
  const [configs, setConfigs] = useState<ConfigSummary[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
  const [isLoadingServer, setIsLoadingServer] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/configs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch configs');
      }

      setConfigs(data.configs);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      toast.error('Failed to load configurations');
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/server');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch server status');
      }

      setServerStatus(data);
    } catch (error) {
      console.error('Failed to fetch server status:', error);
      setServerStatus({
        isOnline: false,
        v2rayRunning: false,
        lastChecked: new Date(),
        ip: 'Unknown',
        port: 443,
        clientCount: 0,
        error: 'Failed to connect to server',
      });
    } finally {
      setIsLoadingServer(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchServerStatus();
  }, []);

  const handleCreateConfig = async (data: CreateConfigRequest) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create configuration');
      }

      toast.success('Configuration created successfully!');
      await fetchConfigs(); // Refresh the list
      await fetchServerStatus(); // Refresh server status
    } catch (error) {
      console.error('Failed to create config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create configuration');
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfig = async (data: UpdateConfigRequest) => {
    if (!editingConfig) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/configs/${editingConfig.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update configuration');
      }

      toast.success('Configuration updated successfully!');
      await fetchConfigs(); // Refresh the list
    } catch (error) {
      console.error('Failed to update config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update configuration');
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      const response = await fetch(`/api/configs/${configId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete configuration');
      }

      toast.success('Configuration deleted successfully!');
      await fetchConfigs(); // Refresh the list
      await fetchServerStatus(); // Refresh server status
    } catch (error) {
      console.error('Failed to delete config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete configuration');
    }
  };

  const handleAddNew = () => {
    setEditingConfig(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (config: ConfigSummary) => {
    setEditingConfig(config);
    setIsEditorOpen(true);
  };

  const handleSave = async (data: CreateConfigRequest | UpdateConfigRequest) => {
    if (editingConfig) {
      await handleUpdateConfig(data);
    } else {
      await handleCreateConfig(data);
    }
  };

  const handleEditorClose = () => {
    if (!isSaving) {
      setIsEditorOpen(false);
      setEditingConfig(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            VLESS Config Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your VLESS VPN configurations on Oracle Cloud
          </p>
        </div>

        {/* Server Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Status
            </h2>
            {isLoadingServer && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>

          {serverStatus && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${serverStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Server</span>
                <span className={`text-sm font-medium ${serverStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {serverStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${serverStatus.v2rayRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">V2Ray</span>
                <span className={`text-sm font-medium ${serverStatus.v2rayRunning ? 'text-green-600' : 'text-red-600'}`}>
                  {serverStatus.v2rayRunning ? 'Running' : 'Stopped'}
                </span>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">IP:</span> {serverStatus.ip}:{serverStatus.port}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Configs:</span> {serverStatus.clientCount}
              </div>
            </div>
          )}

          {serverStatus?.error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800 dark:text-red-200">
                  {serverStatus.error}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Config List */}
        <ConfigList
          configs={configs}
          isLoading={isLoadingConfigs}
          onRefresh={fetchConfigs}
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          onDelete={handleDeleteConfig}
        />

        {/* Config Editor Modal */}
        <ConfigEditor
          config={editingConfig}
          isOpen={isEditorOpen}
          onClose={handleEditorClose}
          onSave={handleSave}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
