import { Card } from "@/components/ui/card";
import { Code2 } from "lucide-react";

interface PreviewPanelProps {
  code: string | null;
}

export const PreviewPanel = ({ code }: PreviewPanelProps) => {
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
      <div className="p-4 border-b border-border bg-background">
        <h2 className="text-lg font-bold">المعاينة</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Card className="p-4">
          <pre className="text-sm overflow-x-auto">
            <code>{code}</code>
          </pre>
        </Card>
      </div>
    </div>
  );
};
