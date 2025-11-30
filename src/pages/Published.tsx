import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, LogOut, Globe, ExternalLink, User, Plus, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Deployment {
  id: string;
  project_id: string;
  vercel_url: string | null;
  status: string;
  created_at: string;
}

interface Domain {
  id: string;
  domain: string;
  status: string;
  ssl_enabled: boolean;
  verification_record: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deployments?: Deployment[];
  domains?: Domain[];
}

export default function Published() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchPublishedProjects();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchPublishedProjects = async () => {
    // Get projects with deployments
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (projectsError) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في تحميل المشاريع",
      });
      setIsLoading(false);
      return;
    }

    // Get deployments for all projects
    const { data: deploymentsData } = await supabase
      .from("deployments")
      .select("*")
      .eq("status", "ready")
      .in("project_id", projectsData?.map(p => p.id) || []);

    // Get domains for all projects
    const { data: domainsData } = await supabase
      .from("domains")
      .select("*")
      .in("project_id", projectsData?.map(p => p.id) || []);

    // Combine data
    const projectsWithDeployments = projectsData?.map(project => ({
      ...project,
      deployments: deploymentsData?.filter(d => d.project_id === project.id) || [],
      domains: domainsData?.filter(d => d.project_id === project.id) || [],
    })) || [];

    // Filter to only show projects with deployments
    setProjects(projectsWithDeployments.filter(p => p.deployments && p.deployments.length > 0));
    setIsLoading(false);
  };

  const handleAddDomain = async () => {
    if (!selectedProject || !newDomain) return;

    setIsAddingDomain(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-domain', {
        body: {
          action: 'add',
          projectId: selectedProject,
          domain: newDomain,
        }
      });

      if (error) throw error;

      toast({
        title: "تمت إضافة النطاق",
        description: data.verification 
          ? `يرجى إضافة سجل DNS: ${data.verification[0]?.value}`
          : "تم إضافة النطاق بنجاح",
      });

      setNewDomain("");
      setSelectedProject(null);
      fetchPublishedProjects();
    } catch (error) {
      console.error('Domain add error:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في إضافة النطاق",
      });
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-domain', {
        body: {
          action: 'remove',
          domainId,
        }
      });

      if (error) throw error;

      toast({
        title: "تم حذف النطاق",
        description: "تم حذف النطاق بنجاح",
      });

      fetchPublishedProjects();
    } catch (error) {
      console.error('Domain remove error:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في حذف النطاق",
      });
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-domain', {
        body: {
          action: 'verify',
          domainId,
        }
      });

      if (error) throw error;

      toast({
        title: data.verified ? "تم التحقق من النطاق" : "قيد الانتظار",
        description: data.verified 
          ? "النطاق جاهز للاستخدام مع SSL"
          : "لم يتم التحقق بعد. يرجى التحقق من إعدادات DNS",
      });

      fetchPublishedProjects();
    } catch (error) {
      console.error('Domain verify error:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في التحقق من النطاق",
      });
    }
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              المواقع المنشورة
            </h1>
            <p className="text-xl text-muted-foreground">
              جميع مواقعك المنشورة والمتاحة على الإنترنت
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
              variant="outline"
              onClick={() => navigate("/profile")}
            >
              <User className="w-4 h-4 ml-2" />
              الملف الشخصي
            </Button>
            <Button
              variant="default"
              className="gradient-hero"
            >
              <Globe className="w-4 h-4 ml-2" />
              المواقع المنشورة
            </Button>
          </div>

          {/* Published Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">لا توجد مواقع منشورة</h3>
                <p className="text-muted-foreground mb-6">
                  ابدأ بإنشاء مشروعك الأول ونشره
                </p>
                <Button onClick={() => navigate("/app")} className="gradient-hero">
                  إنشاء مشروع جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project) => {
                const latestDeployment = project.deployments?.[0];
                return (
                  <Card
                    key={project.id}
                    className="hover-lift group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {project.name}
                          </CardTitle>
                          <CardDescription>
                            {project.description || "لا يوجد وصف"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            latestDeployment?.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
                          } animate-pulse`} />
                          <span className="text-xs text-muted-foreground">
                            {latestDeployment?.status === 'ready' ? 'نشط' : 'قيد المعالجة'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          نُشر: {new Date(latestDeployment?.created_at || project.created_at).toLocaleDateString("ar-EG")}
                        </span>
                      </div>

                      {latestDeployment?.vercel_url && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">الرابط الرئيسي:</p>
                          <a 
                            href={`https://${latestDeployment.vercel_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline break-all"
                          >
                            {latestDeployment.vercel_url}
                          </a>
                        </div>
                      )}

                      {project.domains && project.domains.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">النطاقات المخصصة:</p>
                          {project.domains.map((domain) => (
                            <div key={domain.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{domain.domain}</span>
                                {domain.status === 'active' ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-yellow-500" />
                                )}
                                {domain.ssl_enabled && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">SSL</span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleVerifyDomain(domain.id)}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveDomain(domain.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {latestDeployment?.vercel_url && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 gradient-hero"
                            onClick={() => window.open(`https://${latestDeployment.vercel_url}`, '_blank')}
                          >
                            <Globe className="w-3 h-3 ml-1" />
                            عرض الموقع
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedProject(project.id)}
                            >
                              <Plus className="w-3 h-3 ml-1" />
                              إضافة نطاق
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>إضافة نطاق مخصص</DialogTitle>
                              <DialogDescription>
                                أضف نطاقك الخاص للمشروع. ستحتاج إلى تحديث إعدادات DNS الخاصة بك.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Input
                                placeholder="example.com"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                dir="ltr"
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleAddDomain}
                                disabled={isAddingDomain || !newDomain}
                              >
                                {isAddingDomain ? "جاري الإضافة..." : "إضافة"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
