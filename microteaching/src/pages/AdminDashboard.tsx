import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, School as SchoolIcon, Users, BookOpen, User, BarChart3, FileText, Settings, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import SchoolManager from "@/components/admin/SchoolManager";
import QuotaManager from "@/components/admin/QuotaManager";
import RegistrationStats from "@/components/admin/RegistrationStats";
import ReportsManager from "@/components/admin/ReportsManager";

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"schools" | "quotas" | "stats" | "reports">("schools");
  const [realtimeStats, setRealtimeStats] = useState({
    totalSchools: 0,
    totalRegistrations: 0,
    availableQuotas: 0,
    utilizationRate: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    loadRealtimeStats();
    
    // Set interval untuk update stats setiap 30 detik
    const intervalId = setInterval(loadRealtimeStats, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    loadRealtimeStats();
  }, [activeTab]);

  const checkAdminAccess = () => {
    // Check if admin session exists in localStorage
    const adminSession = localStorage.getItem('admin_session');
    
    if (!adminSession) {
      toast.error("Session expired. Please login again.");
      navigate("/admin/login");
      return;
    }

    try {
      const sessionData = JSON.parse(adminSession);
      
      // Check if session is not expired (demo: 24 hours)
      const loginTime = new Date(sessionData.loggedInAt).getTime();
      const currentTime = new Date().getTime();
      const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);
      
      if (hoursSinceLogin > 24) {
        localStorage.removeItem('admin_session');
        toast.error("Session expired. Please login again.");
        navigate("/admin/login");
        return;
      }

      setAdminData({
        name: sessionData.name,
        email: sessionData.email,
        role: sessionData.role
      });
      setIsLoading(false);
    } catch (error) {
      localStorage.removeItem('admin_session');
      navigate("/admin/login");
    }
  };

  const loadRealtimeStats = () => {
    try {
      // Load schools data
      const savedSchools = localStorage.getItem('schools_data');
      let schoolsData = [];
      if (savedSchools) {
        schoolsData = JSON.parse(savedSchools);
      }
      
      // Load registrations data
      const savedRegistrations = localStorage.getItem('student_registrations');
      let registrationsData = [];
      if (savedRegistrations) {
        registrationsData = JSON.parse(savedRegistrations);
      }
      
      // Load quotas data
      const savedQuotas = localStorage.getItem('quotas_data');
      let quotasData = [];
      if (savedQuotas) {
        quotasData = JSON.parse(savedQuotas);
      }
      
      // Calculate statistics
      const totalSchools = schoolsData.filter((s: any) => s.status === "active").length;
      const totalRegistrations = registrationsData.length;
      const totalQuotas = quotasData.reduce((sum: number, q: any) => sum + q.total_quota, 0);
      const totalRegistered = quotasData.reduce((sum: number, q: any) => sum + q.registered_count, 0);
      const availableQuotas = totalQuotas - totalRegistered;
      const utilizationRate = totalQuotas > 0 ? Math.round((totalRegistered / totalQuotas) * 100) : 0;
      
      setRealtimeStats({
        totalSchools,
        totalRegistrations,
        availableQuotas,
        utilizationRate
      });
    } catch (error) {
      console.error("Error loading realtime stats:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const handleQuickAction = (action: string) => {
    switch(action) {
      case "refresh":
        loadRealtimeStats();
        toast.success("Data refreshed!");
        break;
      case "export":
        toast.info("Export feature available in Reports tab");
        setActiveTab("reports");
        break;
      case "settings":
        toast.info("Settings coming soon!");
        break;
      case "help":
        toast.info("Help documentation coming soon!");
        break;
      default:
        break;
    }
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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Field Experience Management System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="font-medium text-sm truncate max-w-[200px]">{adminData?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{adminData?.role?.replace('_', ' ')}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleQuickAction("refresh")}
                  title="Refresh Data"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
                <Button variant="outline" onClick={handleLogout} size="sm" className="hidden md:flex">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <Button variant="outline" onClick={handleLogout} size="icon" className="md:hidden">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold mb-1">Welcome back, {adminData?.name}! 👋</h2>
                <p className="text-sm text-muted-foreground">
                  Manage schools, quotas, monitor registrations, and generate reports from this dashboard.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border shadow-sm">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{adminData?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{adminData?.role?.replace('_', ' ')} Admin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Schools</p>
                  <p className="text-xl md:text-2xl font-bold">{realtimeStats.totalSchools}</p>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <SchoolIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Registrations</p>
                  <p className="text-xl md:text-2xl font-bold">{realtimeStats.totalRegistrations}</p>
                </div>
                <div className="bg-green-500/10 p-2 rounded-full">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available Quotas</p>
                  <p className="text-xl md:text-2xl font-bold">{realtimeStats.availableQuotas}</p>
                </div>
                <div className="bg-purple-500/10 p-2 rounded-full">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Utilization Rate</p>
                  <p className="text-xl md:text-2xl font-bold">{realtimeStats.utilizationRate}%</p>
                </div>
                <div className="bg-orange-500/10 p-2 rounded-full">
                  <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used management tasks</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleQuickAction("refresh")}
                className="gap-2"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                onClick={() => setActiveTab("schools")}
              >
                <div className="bg-blue-100 p-2 rounded-lg">
                  <SchoolIcon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Manage Schools</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                onClick={() => setActiveTab("quotas")}
              >
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Set Quotas</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200 transition-colors"
                onClick={() => setActiveTab("stats")}
              >
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium">View Stats</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                onClick={() => setActiveTab("reports")}
              >
                <div className="bg-orange-100 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium">Reports</span>
              </Button>
            </div>
            
            {/* Secondary Actions */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleQuickAction("export")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Data
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleQuickAction("settings")}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleQuickAction("help")}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Help & Docs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <div className="flex gap-1 md:gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={activeTab === "schools" ? "default" : "outline"}
            onClick={() => setActiveTab("schools")}
            className="flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <SchoolIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Schools</span>
            <span className="sm:hidden">Schools</span>
          </Button>
          <Button
            variant={activeTab === "quotas" ? "default" : "outline"}
            onClick={() => setActiveTab("quotas")}
            className="flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Quotas</span>
            <span className="sm:hidden">Quotas</span>
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
            className="flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Statistics</span>
            <span className="sm:hidden">Stats</span>
          </Button>
          <Button
            variant={activeTab === "reports" ? "default" : "outline"}
            onClick={() => setActiveTab("reports")}
            className="flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
            <span className="sm:hidden">Reports</span>
          </Button>
        </div>

        {/* Tab Indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`h-1 w-8 rounded-full ${activeTab === "schools" ? "bg-blue-500" : "bg-muted"}`}></div>
            <div className={`h-1 w-8 rounded-full ${activeTab === "quotas" ? "bg-purple-500" : "bg-muted"}`}></div>
            <div className={`h-1 w-8 rounded-full ${activeTab === "stats" ? "bg-green-500" : "bg-muted"}`}></div>
            <div className={`h-1 w-8 rounded-full ${activeTab === "reports" ? "bg-orange-500" : "bg-muted"}`}></div>
            <span className="ml-2 text-xs">
              {activeTab === "schools" && "School Management"}
              {activeTab === "quotas" && "Quota Management"}
              {activeTab === "stats" && "Registration Statistics"}
              {activeTab === "reports" && "Analytics & Reports"}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="border rounded-lg p-3 md:p-6 bg-card shadow-sm min-h-[500px]">
          {activeTab === "schools" && <SchoolManager />}
          {activeTab === "quotas" && <QuotaManager />}
          {activeTab === "stats" && <RegistrationStats />}
          {activeTab === "reports" && <ReportsManager />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Admin Portal • Field Experience Management System
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>System Status: Operational</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleQuickAction("refresh")}
                className="text-xs gap-1"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-xs"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;