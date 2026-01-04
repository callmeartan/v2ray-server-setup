import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PingResult, PingTest } from "@/types/api";
import { Activity, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getStatusColor } from "@/lib/utils";

interface PingTestCardProps {
  pingResult: PingResult | undefined;
  isLoading: boolean;
  onTest: () => void;
}

function getTestIcon(test: PingTest) {
  if (test.success) {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
  return <XCircle className="h-4 w-4 text-red-600" />;
}

function getTestBadgeVariant(test: PingTest) {
  return test.success ? "success" : "error";
}

export function PingTestCard({ pingResult, isLoading, onTest }: PingTestCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Connectivity Tests
            </CardTitle>
            <CardDescription>Test server connectivity and endpoints</CardDescription>
          </div>
          <Button onClick={onTest} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Testing...' : 'Test'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pingResult ? (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status</span>
              <Badge className={getStatusColor(pingResult.overall.status)}>
                {pingResult.overall.score} ({pingResult.overall.percentage}%)
              </Badge>
            </div>

            {/* Individual Tests */}
            <div className="space-y-3">
              {pingResult.tests.map((test, index) => (
                <div key={index} className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    {getTestIcon(test)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{test.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {test.details}
                        {test.latency && (
                          <span className="ml-2 text-muted-foreground">
                            {test.latency}
                          </span>
                        )}
                      </div>
                      {test.error && (
                        <div className="text-xs text-red-600 mt-1">
                          {test.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getTestBadgeVariant(test)} className="shrink-0">
                    {test.success ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Last tested: {new Date(pingResult.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Run connectivity tests to check server availability
            </p>
            <Button onClick={onTest} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
