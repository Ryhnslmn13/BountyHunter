import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, School as SchoolIcon, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import SchoolManager from "@/components/admin/SchoolManager";
import QuotaManager from "@/components/admin/QuotaManager";
import RegistrationStats from "@/components/admin/RegistrationStats";

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schools" | "quotas" | "stats">("schools");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        toast.error("Access Denied");
        navigate("/admin/login");
        return;
      }

      setIsLoading(false);
    } catch (error) {
      navigate("/admin/login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Field Experience Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === "schools" ? "default" : "outline"}
            onClick={() => setActiveTab("schools")}
            className="flex items-center gap-2"
          >
            <SchoolIcon className="h-4 w-4" />
            Schools
          </Button>
          <Button
            variant={activeTab === "quotas" ? "default" : "outline"}
            onClick={() => setActiveTab("quotas")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Quotas
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Statistics
          </Button>
        </div>

        {/* Content */}
        {activeTab === "schools" && <SchoolManager />}
        {activeTab === "quotas" && <QuotaManager />}
        {activeTab === "stats" && <RegistrationStats />}
      </main>
    </div>
  );
};

export default AdminDashboard;
