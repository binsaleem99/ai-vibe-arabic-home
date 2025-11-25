import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      {/* Header with Auth Buttons */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>AI Vibe Coder</span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </Button>
            <Button 
              className="gradient-hero gap-2"
              onClick={() => navigate("/auth")}
            >
              <UserPlus className="w-4 h-4" />
              حساب جديد
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container relative z-10 mx-auto px-4 py-16 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold animate-scale-in">
            <Sparkles className="w-4 h-4" />
            <span>منصة البرمجة بالذكاء الاصطناعي</span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            حول أفكارك إلى كود
            <span className="block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              بقوة الذكاء الاصطناعي
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI Vibe Coder يساعدك على كتابة كود احترافي بسرعة وكفاءة عالية
            باستخدام أحدث تقنيات الذكاء الاصطناعي
          </p>
          
          {/* CTA Button */}
          <div className="pt-4">
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg font-semibold gradient-hero shadow-glow hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              ابدأ مجاناً الآن
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
