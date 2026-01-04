import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServerConfig } from "@/types/api";
import { Settings, Users, Globe, Shield, RefreshCw } from "lucide-react";

interface ConfigCardProps {
  config: ServerConfig | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ConfigCard({ config, isLoading, onRefresh }: ConfigCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Server Configuration
          </CardTitle>
          <CardDescription>Loading server configuration...</CardDescription>
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

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Server Configuration
          </CardTitle>
          <CardDescription>Unable to load server configuration</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Server Configuration
            </CardTitle>
            <CardDescription>VLESS server settings and clients</CardDescription>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4" />
              <span className="font-medium">Network</span>
            </div>
            <Badge variant="outline">{config.network.toUpperCase()}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Security</span>
            </div>
            <Badge variant="outline">{config.security || 'none'}</Badge>
          </div>
        </div>

        {/* Connection Details */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Connection Details</div>
          <div className="bg-muted p-3 rounded-md font-mono text-sm">
            <div>Host: {config.host}</div>
            <div>Port: {config.port}</div>
            <div>Path: {config.path}</div>
          </div>
        </div>

        {/* Clients */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Clients ({config.clients.length})</span>
          </div>
          <div className="space-y-2">
            {config.clients.map((client, index) => (
              <div key={client.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div>
                  <div className="font-medium text-sm">{client.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {client.id.slice(0, 8)}...
                  </div>
                </div>
                <Badge variant="outline">Level {client.level}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Last updated: {new Date(config.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
