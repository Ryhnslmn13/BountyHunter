import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Eye, EyeOff, Key, User } from "lucide-react";
import { toast } from "sonner";

// Data dummy hanya untuk super admin
const SUPER_ADMIN = {
  email: "admin@university.edu",
  password: "admin123",
  name: "Super Admin",
  role: "super_admin",
  permissions: ["manage_all", "view_reports", "manage_users", "manage_schools", "manage_quotas"]
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulasi loading
    setTimeout(() => {
      // Validasi credentials
      if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
        // Simpan session di localStorage
        localStorage.setItem('admin_session', JSON.stringify({
          ...SUPER_ADMIN,
          loggedInAt: new Date().toISOString(),
          token: 'demo-token-' + Math.random().toString(36).substr(2, 9)
        }));

        toast.success(`Welcome, ${SUPER_ADMIN.name}!`, {
          description: "Redirecting to admin dashboard...",
        });

        // Redirect ke dashboard admin
        navigate("/admin/dashboard");
      } else {
        toast.error("Login Failed", {
          description: "Invalid email or password. Please use admin@university.edu / admin123",
        });
        setIsLoading(false);
      }
    }, 800);
  };

  // Fungsi untuk auto-fill super admin credentials
  const fillSuperAdminCredentials = () => {
    setEmail(SUPER_ADMIN.email);
    setPassword(SUPER_ADMIN.password);
    
    toast.info("Super Admin Credentials Filled", {
      description: "Ready to login as Super Admin",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-3 rounded-full mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">Field Experience Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Sign in to manage schools and quotas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="admin123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Demo Button untuk Super Admin */}
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={fillSuperAdminCredentials}
                disabled={isLoading}
              >
                <Shield className="mr-2 h-4 w-4" />
                Use Super Admin Credentials
              </Button>
            </div>

            {/* Super Admin Info Card */}
            <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Super Admin Access</h4>
                  <p className="text-xs text-muted-foreground">Full system access</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-xs">{SUPER_ADMIN.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-mono text-xs">{SUPER_ADMIN.password}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-semibold text-primary">{SUPER_ADMIN.role}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {SUPER_ADMIN.permissions.map((perm, index) => (
                    <span 
                      key={index}
                      className="inline-block px-2 py-1 bg-background border rounded text-xs"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Login Hint */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Click the button above to auto-fill credentials, then click "Sign In"
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-4 p-3 border border-amber-200/30 bg-amber-50/10 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong className="font-medium">Note:</strong> This is a demo system. 
                Click "Use Super Admin Credentials" button for quick access.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="link" onClick={() => navigate("/")} className="text-sm">
            ← Back to Student Portal
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Admin Portal • Field Experience Registration System</p>
          <p className="mt-1">Demo Version v1.0 • Super Admin Only</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;