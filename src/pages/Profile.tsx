import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, LogOut, User, Globe, Code2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [projectCount, setProjectCount] = useState<number>(0);
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchUserData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");

      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id);

      setProjectCount(projects?.length || 0);
      setPublishedCount(projects?.length || 0);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AI Vibe Coder</span>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              الملف الشخصي
            </h1>
            <p className="text-xl text-muted-foreground">
              معلوماتك الشخصية وإحصائياتك
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              لوحة التحكم
            </Button>
            <Button
              variant="default"
              className="gradient-hero"
            >
              <User className="w-4 h-4 ml-2" />
              الملف الشخصي
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/published")}
            >
              <Globe className="w-4 h-4 ml-2" />
              المواقع المنشورة
            </Button>
          </div>

          {/* Profile Information */}
          {isLoading ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-12 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات الملف الشخصي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    البريد الإلكتروني
                  </label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-foreground text-lg">{userEmail}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      عدد المشاريع
                    </label>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-primary" />
                        <p className="text-foreground text-lg font-semibold">{projectCount} مشروع</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      المواقع المنشورة
                    </label>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <p className="text-foreground text-lg font-semibold">{publishedCount} موقع</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/dashboard")}
                  >
                    العودة إلى لوحة التحكم
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
