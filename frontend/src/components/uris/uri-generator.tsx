import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UriResponse } from "@/types/api";
import { Copy, Download, RefreshCw, Link, Smartphone } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // We'll create this hook

interface UriGeneratorProps {
  uris: UriResponse | undefined;
  isLoading: boolean;
  onGenerate: (clientNames?: string[]) => void;
}

export function UriGenerator({ uris, isLoading, onGenerate }: UriGeneratorProps) {
  const [customNames, setCustomNames] = useState<string[]>([]);
  const [showCustomNames, setShowCustomNames] = useState(false);
  const { toast } = useToast();

  const handleCopyUri = async (uri: string, name: string) => {
    try {
      await copyToClipboard(uri);
      toast({
        title: "URI Copied",
        description: `${name} URI copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URI to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleGenerateWithNames = () => {
    const names = customNames.filter(name => name.trim());
    onGenerate(names.length > 0 ? names : undefined);
  };

  const handleCustomNameChange = (index: number, value: string) => {
    const newNames = [...customNames];
    newNames[index] = value;
    setCustomNames(newNames);
  };

  const addCustomName = () => {
    setCustomNames([...customNames, ""]);
  };

  const removeCustomName = (index: number) => {
    setCustomNames(customNames.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          VLESS URI Generator
        </CardTitle>
        <CardDescription>
          Generate copy-paste URIs for V2Box and other VLESS-compatible clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Names Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomNames(!showCustomNames)}
          >
            {showCustomNames ? "Hide" : "Show"} Custom Names
          </Button>
          <Button onClick={handleGenerateWithNames} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Generate URIs'}
          </Button>
        </div>

        {/* Custom Names Input */}
        {showCustomNames && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom Client Names</div>
            {customNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Client ${index + 1}`}
                  value={name}
                  onChange={(e) => handleCustomNameChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomName(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCustomName}>
              Add Name
            </Button>
          </div>
        )}

        {/* Generated URIs */}
        {uris && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Server: {uris.server.host}:{uris.server.port}</span>
            </div>

            {uris.uris.map((uri, index) => (
              <div key={uri.uuid} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="font-medium">{uri.name}</span>
                    <Badge variant="outline">Client {index + 1}</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUri(uri.uri, uri.name)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URI
                  </Button>
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <div className="font-mono text-sm break-all text-muted-foreground">
                    {uri.uri}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  UUID: {uri.uuid}
                </div>
              </div>
            ))}

            {/* V2Box Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    How to import in V2Box:
                  </div>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>1. Copy any URI above</li>
                    <li>2. Open V2Box → Press + → Import v2ray uri from clipboard</li>
                    <li>3. Paste the URI and save</li>
                    <li>4. Enable the connection</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {!uris && !isLoading && (
          <div className="text-center py-8">
            <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate VLESS URIs for easy import into V2Box and other clients
            </p>
            <Button onClick={() => onGenerate()}>
              Generate URIs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
