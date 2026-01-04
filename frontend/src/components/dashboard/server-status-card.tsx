import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServerStatus } from "@/types/api";
import { RefreshCw, Server, Wifi, WifiOff, HardDrive, Clock } from "lucide-react";
import { getStatusColor, formatUptime, formatDiskUsage } from "@/lib/utils";

interface ServerStatusCardProps {
  status: ServerStatus | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ServerStatusCard({ status, isLoading, onRefresh }: ServerStatusCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Server Status
          </CardTitle>
          <CardDescription>Checking server connectivity...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Server Status
          </CardTitle>
          <CardDescription>Unable to connect to server</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sshStatus = status.sshConnected ? 'Connected' : 'Disconnected';
  const v2rayStatus = status.v2rayStatus;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Status
            </CardTitle>
            <CardDescription>{status.serverIP}</CardDescription>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SSH Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.sshConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">SSH Connection</span>
          </div>
          <Badge variant={status.sshConnected ? "success" : "error"}>
            {sshStatus}
          </Badge>
        </div>

        {/* V2Ray Service */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="text-sm font-medium">V2Ray Service</span>
          </div>
          <Badge className={getStatusColor(v2rayStatus)}>
            {v2rayStatus}
          </Badge>
        </div>

        {/* Server Info */}
        {status.uptime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatUptime(status.uptime)}</span>
          </div>
        )}

        {status.diskUsage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span>{formatDiskUsage(status.diskUsage)}</span>
          </div>
        )}

        {/* Current IP */}
        <div className="text-xs text-muted-foreground">
          Current IP: {status.currentIP}
        </div>
      </CardContent>
    </Card>
  );
}
