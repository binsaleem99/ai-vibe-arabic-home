import { Card } from "@/components/ui/card";
import { Code2, AlertCircle, Download, Copy, Check } from "lucide-react";
import { LiveProvider, LiveError, LivePreview } from "react-live";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import * as React from "react";

interface PreviewPanelProps {
  code: string | null;
}

export const PreviewPanel = ({ code }: PreviewPanelProps) => {
  const [showCode, setShowCode] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "تم النسخ",
      description: "تم نسخ الكود إلى الحافظة",
    });
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generated-code-${Date.now()}.jsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "تم التنزيل",
      description: "تم تنزيل الكود بنجاح",
    });
  };

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? "المعاينة المباشرة" : "عرض الكود"}
          </Button>
        </div>
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
