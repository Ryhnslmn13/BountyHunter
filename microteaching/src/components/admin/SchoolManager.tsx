import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  location: string;
  min_gpa: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

const SchoolManager = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({ 
    name: "", 
    location: "", 
    min_gpa: 0, 
    latitude: null as number | null, 
    longitude: null as number | null,
    address: ""
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load schools");
      return;
    }

    setSchools(data || []);
    setIsLoading(false);
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("schools")
      .insert([{ 
        name: newSchool.name, 
        location: newSchool.location,
        min_gpa: newSchool.min_gpa,
        latitude: newSchool.latitude,
        longitude: newSchool.longitude,
        address: newSchool.address || null
      }]);

    if (error) {
      toast.error("Failed to add school");
      return;
    }

    toast.success("School added successfully");
    setNewSchool({ name: "", location: "", min_gpa: 0, latitude: null, longitude: null, address: "" });
    setIsDialogOpen(false);
    fetchSchools();
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm("Are you sure you want to delete this school? All associated quotas will be removed.")) {
      return;
    }

    const { error } = await supabase
      .from("schools")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete school");
      return;
    }

    toast.success("School deleted successfully");
    fetchSchools();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading schools...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">School Management</h2>
          <p className="text-muted-foreground">Add, edit, or remove schools</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSchool} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  placeholder="e.g., SMA Negeri 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newSchool.location}
                  onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                  placeholder="e.g., Jakarta"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Full Address (Optional)</Label>
                <Input
                  id="address"
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                  placeholder="e.g., Jl. Example No. 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_gpa">Minimum GPA Requirement</Label>
                <Input
                  id="min_gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={newSchool.min_gpa}
                  onChange={(e) => setNewSchool({ ...newSchool, min_gpa: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 3.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (Optional)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={newSchool.latitude || ""}
                    onChange={(e) => setNewSchool({ ...newSchool, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="-6.200000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude (Optional)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={newSchool.longitude || ""}
                    onChange={(e) => setNewSchool({ ...newSchool, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="106.816666"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Add School</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <Card key={school.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{school.name}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {school.location}
                </div>
                {school.min_gpa > 0 && (
                  <div className="text-xs">Min GPA: {school.min_gpa.toFixed(2)}</div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteSchool(school.id)}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No schools added yet. Click "Add School" to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SchoolManager;
