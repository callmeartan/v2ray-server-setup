'use client';

import { useState } from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { ConfigSummary } from '@/types/config';
import PingIndicator from './PingIndicator';
import ExportButtons from './ExportButtons';

interface ConfigCardProps {
  config: ConfigSummary;
  onEdit: (config: ConfigSummary) => void;
  onDelete: (configId: string) => void;
  className?: string;
}

export default function ConfigCard({
  config,
  onEdit,
  onDelete,
  className = '',
}: ConfigCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the configuration "${config.name}"?`)) {
      onDelete(config.id);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {config.name}
            </h3>
            <PingIndicator
              configId={config.id}
              host="217.142.186.18" // Use default host for now
              port={443}
            />
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>UUID: <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">{config.uuid}</code></p>
            <p>Created: {config.createdAt.toLocaleDateString()}</p>
            {config.lastUsed && (
              <p>Last Used: {config.lastUsed.toLocaleDateString()}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
              <button
                onClick={() => {
                  onEdit(config);
                  setShowActions(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-t-md"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowActions(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-b-md"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <ExportButtons
          configId={config.id}
          configName={config.name}
        />
      </div>
    </div>
  );
}
