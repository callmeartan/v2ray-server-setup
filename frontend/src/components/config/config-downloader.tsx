import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServerConfig } from "@/types/api";
import { Download, FileJson, Smartphone } from "lucide-react";
import { downloadJson } from "@/lib/utils";
import { useDownloadConfig } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";

interface ConfigDownloaderProps {
  config: ServerConfig | undefined;
}

export function ConfigDownloader({ config }: ConfigDownloaderProps) {
  const { mutate: downloadConfig, isPending } = useDownloadConfig();
  const { toast } = useToast();

  const handleDownloadConfig = async (clientIndex: number) => {
    if (!config || !config.clients[clientIndex]) return;

    try {
      const blob = await downloadConfig(clientIndex);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Client-${clientIndex + 1}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Config Downloaded",
        description: `Client-${clientIndex + 1} configuration downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download client configuration",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAllConfigs = () => {
    if (!config) return;

    // Create a summary of all configs
    const allConfigs = {
      server: {
        host: config.host,
        port: config.port,
        network: config.network,
        path: config.path,
        security: config.security,
      },
      clients: config.clients.map((client, index) => ({
        name: client.name,
        uuid: client.id,
        email: client.email,
        level: client.level,
        index: index + 1,
      })),
      generatedAt: new Date().toISOString(),
    };

    downloadJson(allConfigs, `vless-configs-${new Date().toISOString().split('T')[0]}.json`);

    toast({
      title: "Configs Downloaded",
      description: "All client configurations summary downloaded",
    });
  };

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Config Downloader
          </CardTitle>
          <CardDescription>Download client configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileJson className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Load server configuration to download client configs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Config Downloader
        </CardTitle>
        <CardDescription>
          Download V2Box-compatible JSON configurations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download All Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <div className="font-medium">All Configurations</div>
            <div className="text-sm text-muted-foreground">
              Summary of all {config.clients.length} clients
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadAllConfigs}>
            <Download className="h-4 w-4 mr-2" />
            Download Summary
          </Button>
        </div>

        {/* Individual Client Downloads */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Individual Client Configs</div>
          {config.clients.map((client, index) => (
            <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">
                    UUID: {client.id.slice(0, 8)}...
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Level {client.level}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadConfig(index)}
                  disabled={isPending}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* V2Box Instructions */}
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileJson className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-2">
              <div className="font-medium text-green-900 dark:text-green-100">
                How to import JSON configs:
              </div>
              <ol className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>1. Download any client configuration above</li>
                <li>2. Open V2Box → Press + → Import → Select JSON file</li>
                <li>3. Choose the downloaded .json file</li>
                <li>4. Save and enable the connection</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
