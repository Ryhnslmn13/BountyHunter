import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, School, BookOpen, TrendingUp } from "lucide-react";

interface Stats {
  totalStudents: number;
  totalSchools: number;
  totalQuotas: number;
  availableSlots: number;
}

const RegistrationStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalSchools: 0,
    totalQuotas: 0,
    availableSlots: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [registrationsRes, schoolsRes, quotasRes] = await Promise.all([
      supabase.from("registrations").select("id", { count: "exact" }),
      supabase.from("schools").select("id", { count: "exact" }),
      supabase.from("school_quotas").select("total_quota, registered_count"),
    ]);

    const totalQuotas = quotasRes.data?.reduce((sum, q) => sum + q.total_quota, 0) || 0;
    const registeredCount = quotasRes.data?.reduce((sum, q) => sum + q.registered_count, 0) || 0;

    setStats({
      totalStudents: registrationsRes.count || 0,
      totalSchools: schoolsRes.count || 0,
      totalQuotas: totalQuotas,
      availableSlots: totalQuotas - registeredCount,
    });
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Registration Statistics</h2>
        <p className="text-muted-foreground">Overview of the field experience program</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registered Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Total registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">Partner institutions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Quota</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotas}</div>
            <p className="text-xs text-muted-foreground">Available positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableSlots}</div>
            <p className="text-xs text-muted-foreground">Remaining capacity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationStats;
