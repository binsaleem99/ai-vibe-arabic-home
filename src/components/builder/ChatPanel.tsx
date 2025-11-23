import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  projectId: string | null;
  onCodeGenerated: (code: string) => void;
}

export const ChatPanel = ({ projectId, onCodeGenerated }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchMessages();
      fetchLatestCode();
    } else {
      setMessages([]);
    }
  }, [projectId]);

  const fetchLatestCode = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from("generated_apps")
      .select("code")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      onCodeGenerated(data.code);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
      });
    } else {
      setMessages((data as Message[]) || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !projectId || isGenerating) return;

    const userMessage = input.trim();
    setInput("");
    setIsGenerating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Add user message
    const { data: userMsg, error: userError } = await supabase
      .from("messages")
      .insert([
        {
          project_id: projectId,
          user_id: user.id,
          role: "user",
          content: userMessage,
        },
      ])
      .select()
      .single();

    if (userError) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حفظ الرسالة",
      });
      setIsGenerating(false);
      return;
    }

    setMessages((prev) => [...prev, userMsg as Message]);

    // Call AI to generate code
    try {
      const response = await supabase.functions.invoke("generate-code", {
        body: {
          projectId,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mode: "streaming",
        },
      });

      if (response.error) throw response.error;

      const generatedCode = response.data.code || "";
      
      // Add assistant message
      const { data: assistantMsg, error: assistantError } = await supabase
        .from("messages")
        .insert([
          {
            project_id: projectId,
            user_id: user.id,
            role: "assistant",
            content: generatedCode,
          },
        ])
        .select()
        .single();

      if (assistantError) throw assistantError;

      setMessages((prev) => [...prev, assistantMsg as Message]);
      onCodeGenerated(generatedCode);

      // Save to generated_apps table
      const { error: appError } = await supabase
        .from("generated_apps")
        .insert({
          project_id: projectId,
          user_id: user.id,
          code: generatedCode,
        });

      if (appError) {
        console.error("Failed to save generated app:", appError);
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الكود بنجاح",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل في توليد الكود",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-center">اختر مشروعاً أو أنشئ مشروعاً جديداً للبدء</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold">المحادثة</h2>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={`flex-1 p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary/10 text-right"
                    : "bg-muted text-left"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {message.content}
                </pre>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-accent text-accent-foreground">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground animate-pulse">
                  جارٍ إنشاء الكود...
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب طلبك هنا..."
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            disabled={isGenerating}
            dir="rtl"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isGenerating}
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};
