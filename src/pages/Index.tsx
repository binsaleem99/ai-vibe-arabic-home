import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { Pricing } from "@/components/Pricing";
import { UserDashboard } from "@/components/UserDashboard";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  // Show user dashboard if authenticated, otherwise show landing page
  if (isAuthenticated) {
    return <UserDashboard />;
  }

  return (
    <main className="min-h-screen">
      <Hero />
      <Pricing />
    </main>
  );
};

export default Index;
