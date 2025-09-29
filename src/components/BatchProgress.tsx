import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';

interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentFile?: string;
}

interface BatchProgressProps {
  progress: BatchProgress;
  isProcessing: boolean;
  failedFiles?: Array<{ fileName: string; error: string }>;
}

const BatchProgressComponent: React.FC<BatchProgressProps> = ({
  progress,
  isProcessing,
  failedFiles = []
}) => {
  const percentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="px-6 py-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <FileText className="h-5 w-5" />
          Batch Processing Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {isProcessing ? 'Processing...' : 'Complete'}
            </span>
            <span className="font-medium">
              {progress.processed} / {progress.total}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {percentage.toFixed(0)}% complete
          </div>
        </div>

        {/* Current File */}
        {isProcessing && progress.currentFile && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border">
            <Clock className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm">
              Processing: <span className="font-medium">{progress.currentFile}</span>
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Successful</span>
            </div>
            <div className="text-xl font-bold text-success">{progress.successful}</div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Failed</span>
            </div>
            <div className="text-xl font-bold text-destructive">{progress.failed}</div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-xl font-bold">{progress.total}</div>
          </div>
        </div>

        {/* Failed Files Details */}
        {failedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              Failed Files
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {failedFiles.map((file, index) => (
                <div key={index} className="p-2 bg-destructive/5 border border-destructive/20 rounded text-xs">
                  <div className="font-medium">{file.fileName}</div>
                  <div className="text-muted-foreground">{file.error}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchProgressComponent;