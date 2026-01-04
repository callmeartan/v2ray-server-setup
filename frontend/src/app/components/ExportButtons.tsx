'use client';

import { useState } from 'react';
import { Copy, Download, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportButtonsProps {
  configId: string;
  configName: string;
  className?: string;
}

export default function ExportButtons({
  configId,
  configName,
  className = '',
}: ExportButtonsProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyUriToClipboard = async () => {
    setIsCopying(true);
    try {
      const response = await fetch(`/api/export/uri/${configId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate URI');
      }

      await navigator.clipboard.writeText(data.uri);
      toast.success(`VLESS URI for ${configName} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy URI:', error);
      toast.error('Failed to copy URI to clipboard');
    } finally {
      setIsCopying(false);
    }
  };

  const downloadJsonConfig = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/export/json/${configId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download config');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${configName}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`JSON config for ${configName} downloaded!`);
    } catch (error) {
      console.error('Failed to download config:', error);
      toast.error('Failed to download JSON config');
    } finally {
      setIsDownloading(false);
    }
  };

  const showQrCode = () => {
    // TODO: Implement QR code display
    toast('QR code feature coming soon!', { icon: '🚧' });
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={copyUriToClipboard}
        disabled={isCopying}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Copy VLESS URI to clipboard"
      >
        <Copy className="h-4 w-4" />
        {isCopying ? 'Copying...' : 'Copy URI'}
      </button>

      <button
        onClick={downloadJsonConfig}
        disabled={isDownloading}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Download JSON configuration file"
      >
        <Download className="h-4 w-4" />
        {isDownloading ? 'Downloading...' : 'Download JSON'}
      </button>

      <button
        onClick={showQrCode}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        title="Show QR code for easy mobile import"
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </button>
    </div>
  );
}
