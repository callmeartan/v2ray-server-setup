'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { ConfigSummary, CreateConfigRequest, UpdateConfigRequest } from '@/types/config';

interface ConfigEditorProps {
  config?: ConfigSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateConfigRequest | UpdateConfigRequest) => Promise<void>;
  isLoading?: boolean;
}

export default function ConfigEditor({
  config,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: ConfigEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!config;

  useEffect(() => {
    if (isOpen) {
      if (config) {
        setFormData({
          name: config.name,
          notes: '', // Notes not implemented in current backend
        });
      } else {
        setFormData({
          name: '',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, config]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Configuration name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Configuration name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Configuration name must be less than 50 characters';
    }

    // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
    if (formData.name && !/^[a-zA-Z0-9\s\-_]+$/.test(formData.name)) {
      newErrors.name = 'Configuration name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Configuration' : 'Create New Configuration'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Configuration Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., My Home Config"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Optional notes about this configuration..."
              disabled={isLoading}
            />
          </div>

          {isEditing && config && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>UUID:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs">{config.uuid}</code>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <strong>Created:</strong> {config.createdAt.toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
