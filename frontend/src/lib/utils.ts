import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUptime(uptime: string): string {
  if (!uptime) return 'Unknown';

  // Extract load averages from uptime output
  const loadMatch = uptime.match(/load average: ([0-9.]+), ([0-9.]+), ([0-9.]+)/);
  if (loadMatch) {
    return `Load: ${loadMatch[1]}, ${loadMatch[2]}, ${loadMatch[3]}`;
  }

  return uptime.split(' up ')[1]?.split(',')[0] || uptime;
}

export function formatDiskUsage(diskUsage: string): string {
  if (!diskUsage) return 'Unknown';

  const parts = diskUsage.split(/\s+/);
  if (parts.length >= 5) {
    return `${parts[4]} used (${parts[2]}/${parts[1]})`;
  }

  return diskUsage;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'healthy':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 'inactive':
    case 'error':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
