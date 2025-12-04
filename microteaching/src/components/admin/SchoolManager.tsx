import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  MapPin, 
  School as SchoolIcon, 
  Target, 
  Edit, 
  Search,
  Filter,
  Star,
  Globe,
  RefreshCw,
  Play,
  Square,
  Users,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface School {
  id: string;
  name: string;
  location: string;
  min_gpa: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: "active" | "inactive";
  established_year: number;
  total_quotas: number;
  registered_students: number;
}

// Data dummy untuk sekolah
const DUMMY_SCHOOLS: School[] = [
  { 
    id: "s1", 
    name: "SMA Negeri 1 Jakarta", 
    location: "Jakarta Pusat", 
    min_gpa: 3.5, 
    latitude: -6.2088, 
    longitude: 106.8456,
    address: "Jl. Budi Utomo No. 7, Jakarta Pusat",
    status: "active",
    established_year: 1950,
    total_quotas: 12,
    registered_students: 6
  },
  { 
    id: "s2", 
    name: "SMA Negeri 8 Bandung", 
    location: "Bandung", 
    min_gpa: 3.3, 
    latitude: -6.9175, 
    longitude: 107.6191,
    address: "Jl. Solontongan No. 3, Bandung",
    status: "active",
    established_year: 1965,
    total_quotas: 15,
    registered_students: 6
  },
  { 
    id: "s3", 
    name: "SMA Negeri 3 Surabaya", 
    location: "Surabaya", 
    min_gpa: 3.0, 
    latitude: -7.2575, 
    longitude: 112.7521,
    address: "Jl. Pemuda No. 33, Surabaya",
    status: "active",
    established_year: 1952,
    total_quotas: 21,
    registered_students: 14
  },
  { 
    id: "s4", 
    name: "SMA Negeri 5 Yogyakarta", 
    location: "Yogyakarta", 
    min_gpa: 3.2, 
    latitude: -7.7956, 
    longitude: 110.3695,
    address: "Jl. Wardhani No. 1, Yogyakarta",
    status: "active",
    established_year: 1949,
    total_quotas: 12,
    registered_students: 3
  },
  { 
    id: "s5", 
    name: "SMA Negeri 2 Denpasar", 
    location: "Denpasar", 
    min_gpa: 3.0, 
    latitude: -8.6705, 
    longitude: 115.2126,
    address: "Jl. Hayam Wuruk No. 4, Denpasar",
    status: "active",
    established_year: 1962,
    total_quotas: 15,
    registered_students: 10
  },
  { 
    id: "s6", 
    name: "SMA Negeri 4 Medan", 
    location: "Medan", 
    min_gpa: 3.1, 
    latitude: 3.5952, 
    longitude: 98.6722,
    address: "Jl. Gelas No. 12, Medan",
    status: "active",
    established_year: 1955,
    total_quotas: 9,
    registered_students: 4
  },
  { 
    id: "s7", 
    name: "SMA Negeri 7 Semarang", 
    location: "Semarang", 
    min_gpa: 2.8, 
    latitude: -6.9667, 
    longitude: 110.4167,
    address: "Jl. Pandanaran No. 21, Semarang",
    status: "active",
    established_year: 1972,
    total_quotas: 12,
    registered_students: 7
  },
  { 
    id: "s8", 
    name: "SMA Negeri 6 Makassar", 
    location: "Makassar", 
    min_gpa: 2.9, 
    latitude: -5.1477, 
    longitude: 119.4327,
    address: "Jl. Lanto Daeng Pasewang, Makassar",
    status: "inactive",
    established_year: 1968,
    total_quotas: 0,
    registered_students: 0
  },
  { 
    id: "s9", 
    name: "SMA Negeri 1 Bandung", 
    location: "Bandung", 
    min_gpa: 3.2, 
    latitude: -6.9220, 
    longitude: 107.6065,
    address: "Jl. Ir. H. Juanda No. 93, Bandung",
    status: "active",
    established_year: 1950,
    total_quotas: 5,    // Total kapasitas: 5
    registered_students: 2  // Sudah terisi: 2
  },
];

interface Registration {
  school_id: string;
  subject: string;
  timestamp: string;
  student_id: string;
  student_name: string;
}

const SchoolManager = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  
  // TAMBAHKAN STATE INI:
  const [demoMode, setDemoMode] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  
  const [formData, setFormData] = useState({
    name: "", 
    location: "", 
    min_gpa: 0, 
    latitude: null as number | null, 
    longitude: null as number | null,
    address: "",
    established_year: new Date().getFullYear(),
    status: "active" as "active" | "inactive"
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Load schools from localStorage
        const savedSchools = localStorage.getItem('schools_data');
        let schoolsData: School[] = [];
        
        if (savedSchools) {
          try {
            schoolsData = JSON.parse(savedSchools);
          } catch (error) {
            console.error("Error parsing schools data:", error);
            schoolsData = DUMMY_SCHOOLS;
            localStorage.setItem('schools_data', JSON.stringify(DUMMY_SCHOOLS));
          }
        } else {
          // If no data in localStorage, use dummy data and save it
          schoolsData = DUMMY_SCHOOLS;
          localStorage.setItem('schools_data', JSON.stringify(DUMMY_SCHOOLS));
        }

        // Load registrations from localStorage
        const savedRegistrations = localStorage.getItem('student_registrations');
        let registrationsData: Registration[] = [];
        
        if (savedRegistrations) {
          try {
            registrationsData = JSON.parse(savedRegistrations);
          } catch (error) {
            console.error("Error parsing registrations:", error);
            registrationsData = [];
          }
        }

        setSchools(schoolsData);
        setRegistrations(registrationsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in loadData:", error);
        toast.error("Failed to load data");
        setSchools(DUMMY_SCHOOLS);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Save data to localStorage whenever schools change
  useEffect(() => {
    if (schools.length > 0) {
      localStorage.setItem('schools_data', JSON.stringify(schools));
    }
  }, [schools]);

  // TAMBAHKAN: Fungsi untuk mendapatkan daftar siswa yang terdaftar di sekolah
  const getRegisteredStudents = (schoolId: string) => {
    return registrations.filter(reg => reg.school_id === schoolId);
  };

  // TAMBAHKAN: Fungsi untuk mendapatkan jumlah siswa per subject di sekolah
  const getSubjectDistribution = (schoolId: string) => {
    const schoolRegistrations = registrations.filter(reg => reg.school_id === schoolId);
    const distribution: Record<string, number> = {};
    
    schoolRegistrations.forEach(reg => {
      if (!distribution[reg.subject]) {
        distribution[reg.subject] = 0;
      }
      distribution[reg.subject]++;
    });
    
    return distribution;
  };

  // TAMBAHKAN: Fungsi untuk sync data antara schools dan registrations
  const syncSchoolRegistrations = () => {
    // Hitung ulang registered_students dari registrations
    const updatedSchools = schools.map(school => {
      const schoolRegistrations = registrations.filter(reg => reg.school_id === school.id);
      return {
        ...school,
        registered_students: schoolRegistrations.length
      };
    });

    setSchools(updatedSchools);
    localStorage.setItem('schools_data', JSON.stringify(updatedSchools));
    toast.success("School registrations synced");
  };

  // TAMBAHKAN FUNGSI INI: Update registrasi sekolah
  const updateSchoolRegistration = (schoolId: string, newCount: number) => {
    if (newCount < 0) return;
    
    const school = schools.find(s => s.id === schoolId);
    if (!school) return;
    
    // Update schools data
    const updatedSchools = schools.map(s => 
      s.id === schoolId 
        ? { 
            ...s, 
            registered_students: Math.min(newCount, s.total_quotas)
          }
        : s
    );
    
    setSchools(updatedSchools);
    
    // Update localStorage
    localStorage.setItem('schools_data', JSON.stringify(updatedSchools));
    
    // Update quotas data juga
    const quotas = localStorage.getItem('quotas_data');
    if (quotas) {
      const quotasData = JSON.parse(quotas);
      const schoolQuotas = quotasData.filter((q: any) => q.school_id === schoolId);
      
      // Distribute the new count among subjects
      const updatedQuotas = quotasData.map((quota: any) => {
        if (quota.school_id === schoolId) {
          // Simple distribution logic - bisa disesuaikan
          const subjectRegCount = Math.floor(newCount / schoolQuotas.length);
          return {
            ...quota,
            registered_count: subjectRegCount
          };
        }
        return quota;
      });
      
      localStorage.setItem('quotas_data', JSON.stringify(updatedQuotas));
    }
    
    toast.success(`Updated ${school.name} to ${newCount} students`);
  };

  // TAMBAHKAN FUNGSI INI: Simulasi registrasi otomatis
  const startDemoSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    
    setDemoMode(true);
    toast.success("Demo mode started! Registrations will be simulated.");
    
    const interval = setInterval(() => {
      setSchools(prevSchools => {
        // Pilih sekolah aktif secara acak
        const activeSchools = prevSchools.filter(s => s.status === "active" && s.registered_students < s.total_quotas);
        if (activeSchools.length === 0) {
          toast.info("All schools are full! Stopping demo.");
          stopDemoSimulation();
          return prevSchools;
        }
        
        const randomIndex = Math.floor(Math.random() * activeSchools.length);
        const school = activeSchools[randomIndex];
        
        // Tambah 1 registrasi
        return prevSchools.map(s => 
          s.id === school.id 
            ? { ...s, registered_students: s.registered_students + 1 }
            : s
        );
      });
    }, 3000); // Update setiap 3 detik
    
    setSimulationInterval(interval);
  };

  const stopDemoSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setDemoMode(false);
    toast.info("Demo mode stopped");
  };

  // Cleanup interval saat komponen unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  // Filter schools
  const filteredSchools = schools.filter(school => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || school.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const stats = {
    totalSchools: schools.length,
    activeSchools: schools.filter(s => s.status === "active").length,
    totalQuotas: schools.reduce((sum, s) => sum + s.total_quotas, 0),
    totalStudents: registrations.length, // Gunakan dari registrations
    avgGpa: schools.length > 0 ? (schools.reduce((sum, s) => sum + s.min_gpa, 0) / schools.length).toFixed(1) : "0.0"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi form
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    let updatedSchools: School[];
    
    if (editingSchool) {
      // Update existing school
      updatedSchools = schools.map(s => 
        s.id === editingSchool.id 
          ? { ...s, ...formData }
          : s
      );
      toast.success("School updated successfully");
    } else {
      // Add new school
      const newSchool: School = {
        id: `s${Date.now()}`,
        ...formData,
        total_quotas: 0,
        registered_students: 0
      };

      updatedSchools = [...schools, newSchool];
      toast.success("School added successfully");
    }

    // Update state (akan trigger useEffect yang save ke localStorage)
    setSchools(updatedSchools);

    // Reset form
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      location: school.location,
      min_gpa: school.min_gpa,
      latitude: school.latitude,
      longitude: school.longitude,
      address: school.address || "",
      established_year: school.established_year,
      status: school.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const school = schools.find(s => s.id === id);
    
    if (!confirm(`Are you sure you want to delete "${school?.name}"? This action cannot be undone.`)) {
      return;
    }

    // Check if school has registered students
    if (school && school.registered_students > 0) {
      toast.error("Cannot delete school with registered students");
      return;
    }

    const updatedSchools = schools.filter(s => s.id !== id);
    setSchools(updatedSchools);
    toast.success("School deleted successfully");
  };

  const resetForm = () => {
    setFormData({
      name: "", 
      location: "", 
      min_gpa: 0, 
      latitude: null, 
      longitude: null,
      address: "",
      established_year: new Date().getFullYear(),
      status: "active"
    });
    setEditingSchool(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading school data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SchoolIcon className="h-6 w-6" />
            School Management
          </h2>
          <p className="text-muted-foreground">Manage partner schools and their requirements</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={syncSchoolRegistrations}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Data
          </Button>
          
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add School
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingSchool ? (
                    <>
                      <Edit className="h-5 w-5" />
                      Edit School
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Add New School
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., SMA Negeri 1 Jakarta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">City/Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Jakarta Pusat"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., Jl. Budi Utomo No. 7"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_gpa">Minimum GPA</Label>
                    <Input
                      id="min_gpa"
                      type="number"
                      step="0.1"
                      min="0"
                      max="4"
                      value={formData.min_gpa}
                      onChange={(e) => setFormData({ ...formData, min_gpa: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g., 3.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="established_year">Established Year</Label>
                    <Input
                      id="established_year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.established_year}
                      onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.status === "active" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, status: "active" })}
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={formData.status === "inactive" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, status: "inactive" })}
                    >
                      Inactive
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude (Optional)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={formData.latitude || ""}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="-6.2088"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude (Optional)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={formData.longitude || ""}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="106.8456"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full">
                    {editingSchool ? "Update School" : "Add School"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Demo Mode Alert */}
      {demoMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Play className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">Live Demo Mode Active</p>
                <p className="text-sm text-yellow-600">
                  Simulating student registrations every 3 seconds...
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={stopDemoSimulation} className="gap-2">
              <Square className="h-4 w-4" />
              Stop Demo
            </Button>
          </div>
        </div>
      )}

      {/* Demo Tools Panel */}
      {!demoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Demo Tools</h3>
              <p className="text-sm text-blue-600">
                Simulate real-time registration data for client demonstration
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startDemoSimulation} className="gap-2">
                <Play className="h-4 w-4" />
                Start Live Demo
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                // Reset semua data ke nilai awal
                setSchools(DUMMY_SCHOOLS);
                localStorage.setItem('schools_data', JSON.stringify(DUMMY_SCHOOLS));
                toast.success("Data reset to initial state");
              }} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Schools</p>
                <p className="text-2xl font-bold">{stats.totalSchools}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <SchoolIcon className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Schools</p>
                <p className="text-2xl font-bold">{stats.activeSchools}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Positions</p>
                <p className="text-2xl font-bold">{stats.totalQuotas}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <Star className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registered Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sync Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-800 mb-1">Data Synchronization Active</p>
            <p className="text-sm text-green-700">
              School registration counts are automatically synced with student registration data. 
              Click "Sync Data" above to manually refresh.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-green-600">
                <UserCheck className="inline h-3 w-3 mr-1" />
                {registrations.length} total student registrations
              </span>
              <span className="text-blue-600">
                <SchoolIcon className="inline h-3 w-3 mr-1" />
                {stats.activeSchools} active schools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Controls Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Controls
          </CardTitle>
          <CardDescription>
            Manually adjust registration numbers for demonstration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchools.slice(0, 3).map(school => {
              const registeredStudents = getRegisteredStudents(school.id);
              const subjectDistribution = getSubjectDistribution(school.id);
              
              return (
                <div key={school.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm truncate">{school.name}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current:</span>
                      <span className="font-medium">
                        {registeredStudents.length} students
                      </span>
                    </div>
                    
                    {/* Subject Distribution */}
                    {Object.keys(subjectDistribution).length > 0 && (
                      <div className="text-xs">
                        <p className="font-medium mb-1">By Subject:</p>
                        {Object.entries(subjectDistribution).map(([subject, count]) => (
                          <div key={subject} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{subject}:</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (school.registered_students > 0) {
                            updateSchoolRegistration(school.id, school.registered_students - 1);
                          }
                        }}
                        disabled={school.registered_students <= 0}
                      >
                        -
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (school.registered_students < school.total_quotas) {
                            updateSchoolRegistration(school.id, school.registered_students + 1);
                          }
                        }}
                        disabled={school.registered_students >= school.total_quotas}
                      >
                        +
                      </Button>
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      {school.total_quotas - school.registered_students} slots available
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Active
          </Button>
          <Button
            variant={statusFilter === "inactive" ? "default" : "outline"}
            onClick={() => setStatusFilter("inactive")}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Inactive
          </Button>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((school) => {
          const utilizationRate = school.total_quotas > 0 
            ? Math.round((school.registered_students / school.total_quotas) * 100) 
            : 0;
          
          const registeredStudents = getRegisteredStudents(school.id);
          const subjectDistribution = getSubjectDistribution(school.id);

          return (
            <Card key={school.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${school.status === "active" ? "bg-green-500/10" : "bg-muted"}`}>
                      <SchoolIcon className={`h-4 w-4 ${school.status === "active" ? "text-green-500" : "text-muted-foreground"}`} />
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{school.name}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(school)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(school.id)}
                      disabled={school.registered_students > 0}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{school.location}</span>
                  {school.latitude && school.longitude && (
                    <Globe className="h-3 w-3" />
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={school.min_gpa >= 3.0 ? "default" : "secondary"} className="text-xs">
                    Min GPA: {school.min_gpa.toFixed(1)}
                  </Badge>
                  <Badge variant={school.status === "active" ? "success" : "secondary"} className="text-xs">
                    {school.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                  {registeredStudents.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <UserCheck className="h-2.5 w-2.5 mr-1" />
                      {registeredStudents.length} students
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Established:</span>
                    <span className="font-medium">{school.established_year}</span>
                  </div>
                  
                  {/* Subject Distribution */}
                  {Object.keys(subjectDistribution).length > 0 && (
                    <div className="bg-muted/30 p-2 rounded">
                      <p className="text-xs font-medium mb-1">Students by Subject:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(subjectDistribution).map(([subject, count]) => (
                          <Badge key={subject} variant="secondary" className="text-xs">
                            <span className="capitalize">{subject}</span>: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Positions:</span>
                      <span className="font-medium">
                        {school.registered_students} / {school.total_quotas} filled
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-muted">
                          {utilizationRate}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          utilizationRate >= 90 ? "bg-red-500" :
                          utilizationRate >= 70 ? "bg-yellow-500" :
                          utilizationRate >= 50 ? "bg-green-500" :
                          "bg-blue-500"
                        }`}
                        style={{ width: `${utilizationRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Available: {school.total_quotas - school.registered_students}</span>
                      <span>Capacity: {utilizationRate}%</span>
                    </div>
                  </div>

                  {school.address && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {school.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSchools.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <SchoolIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold mb-2">No schools found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search filters" 
                : "Add your first school to get started"}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold mb-1">Schools Summary</h4>
              <p className="text-sm text-muted-foreground">
                Showing {filteredSchools.length} of {schools.length} schools
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                <UserCheck className="inline h-3 w-3 mr-1" />
                {registrations.length} total student registrations across all schools
              </div>
            </div>
            <div className="text-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold">{stats.totalQuotas}</div>
                  <div className="text-xs text-muted-foreground">Total Positions</div>
                </div>
                <div>
                  <div className="font-bold">{stats.totalStudents}</div>
                  <div className="text-xs text-muted-foreground">Registered</div>
                </div>
                <div>
                  <div className="font-bold">{stats.avgGpa}</div>
                  <div className="text-xs text-muted-foreground">Avg Min GPA</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolManager;