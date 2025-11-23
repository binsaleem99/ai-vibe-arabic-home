import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSidebar } from "@/components/builder/ProjectSidebar";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";

export default function Builder() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden" dir="rtl">
      <ProjectSidebar
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />
      <div className="flex-1 flex">
        <ChatPanel
          projectId={selectedProjectId}
          onCodeGenerated={setGeneratedCode}
        />
        <PreviewPanel code={generatedCode} />
      </div>
    </div>
  );
}
