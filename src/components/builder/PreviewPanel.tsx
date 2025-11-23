import { Card } from "@/components/ui/card";
import { Code2, AlertCircle } from "lucide-react";
import { LiveProvider, LiveError, LivePreview } from "react-live";
import { Button } from "@/components/ui/button";
import * as React from "react";

interface PreviewPanelProps {
  code: string | null;
}

export const PreviewPanel = ({ code }: PreviewPanelProps) => {
  const [showCode, setShowCode] = React.useState(false);

  if (!code) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Code2 className="w-16 h-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">سيظهر الكود المولد هنا</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <h2 className="text-lg font-bold">المعاينة</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? "المعاينة المباشرة" : "عرض الكود"}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {showCode ? (
          <Card className="p-4">
            <pre className="text-sm overflow-x-auto" dir="ltr">
              <code>{code}</code>
            </pre>
          </Card>
        ) : (
          <LiveProvider code={code} scope={{ React }}>
            <Card className="p-4 space-y-4">
              <LiveError className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="flex-1" dir="ltr" />
              </LiveError>
              <div className="min-h-[400px]">
                <LivePreview />
              </div>
            </Card>
          </LiveProvider>
        )}
      </div>
    </div>
  );
};
