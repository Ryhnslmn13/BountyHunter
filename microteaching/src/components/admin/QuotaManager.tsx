import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface School {
  id: string;
  name: string;
  location: string;
}

interface Quota {
  id: string;
  school_id: string;
  subject: string;
  total_quota: number;
  registered_count: number;
  schools: School;
}

const subjects = ["chemistry", "math", "physics", "biology", "english", "indonesian"];

const QuotaManager = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuota, setEditingQuota] = useState<Quota | null>(null);
  const [formData, setFormData] = useState<{
    school_id: string;
    subject: "biology" | "chemistry" | "english" | "indonesian" | "math" | "physics" | "";
    total_quota: number;
  }>({
    school_id: "",
    subject: "",
    total_quota: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [schoolsRes, quotasRes] = await Promise.all([
      supabase.from("schools").select("*").order("name"),
      supabase.from("school_quotas").select("*, schools(*)").order("schools(name)"),
    ]);

    if (schoolsRes.data) setSchools(schoolsRes.data);
    if (quotasRes.data) setQuotas(quotasRes.data as any);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingQuota) {
      const { error } = await supabase
        .from("school_quotas")
        .update({ total_quota: formData.total_quota })
        .eq("id", editingQuota.id);

      if (error) {
        toast.error("Failed to update quota");
        return;
      }
      toast.success("Quota updated successfully");
    } else {
      if (!formData.subject) {
        toast.error("Please select a subject");
        return;
      }

      const { error } = await supabase
        .from("school_quotas")
        .insert([{
          school_id: formData.school_id,
          subject: formData.subject as "biology" | "chemistry" | "english" | "indonesian" | "math" | "physics",
          total_quota: formData.total_quota,
        }]);

      if (error) {
        toast.error("Failed to add quota");
        return;
      }
      toast.success("Quota added successfully");
    }

    setFormData({ school_id: "", subject: "", total_quota: 0 });
    setEditingQuota(null);
    setIsDialogOpen(false);
    fetchData();
  };

  const handleEdit = (quota: Quota) => {
    setEditingQuota(quota);
    setFormData({
      school_id: quota.school_id,
      subject: quota.subject as "biology" | "chemistry" | "english" | "indonesian" | "math" | "physics",
      total_quota: quota.total_quota,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quota?")) return;

    const { error } = await supabase
      .from("school_quotas")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete quota");
      return;
    }

    toast.success("Quota deleted successfully");
    fetchData();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading quotas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quota Management</h2>
          <p className="text-muted-foreground">Manage teaching position quotas for each school</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingQuota(null);
              setFormData({ school_id: "", subject: "", total_quota: 0 });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Quota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuota ? "Edit Quota" : "Add New Quota"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select
                  value={formData.school_id}
                  onValueChange={(value) => setFormData({ ...formData, school_id: value })}
                  disabled={!!editingQuota}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} - {school.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value as any })}
                  disabled={!!editingQuota}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject.charAt(0).toUpperCase() + subject.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quota">Total Quota</Label>
                <Input
                  id="quota"
                  type="number"
                  min="0"
                  value={formData.total_quota}
                  onChange={(e) => setFormData({ ...formData, total_quota: parseInt(e.target.value) })}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {editingQuota ? "Update Quota" : "Add Quota"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {quotas.map((quota) => (
          <Card key={quota.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{quota.schools.name}</CardTitle>
                  <CardDescription>{quota.schools.location}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(quota)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(quota.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {quota.subject.charAt(0).toUpperCase() + quota.subject.slice(1)}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{quota.total_quota - quota.registered_count}</strong> of{" "}
                    {quota.total_quota} slots available
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{quota.registered_count}</div>
                  <div className="text-xs text-muted-foreground">Registered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quotas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quotas added yet. Click "Add Quota" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuotaManager;
