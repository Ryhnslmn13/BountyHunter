import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, BookOpen, School as SchoolIcon, Users, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface School {
  id: string;
  name: string;
  location: string;
  min_gpa?: number;
  status?: "active" | "inactive";
}

interface Quota {
  id: string;
  school_id: string;
  subject: string;
  total_quota: number;
  registered_count: number;
}

interface Registration {
  school_id: string;
  subject: string;
  timestamp: string;
  student_id: string;
  student_name: string;
}

const subjects = [
  { value: "chemistry", label: "Chemistry" },
  { value: "math", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English" },
  { value: "indonesian", label: "Indonesian" },
];

// Data dummy awal untuk kuota
const DUMMY_QUOTAS_INITIAL: Quota[] = [
  { id: "q1", school_id: "s1", subject: "math", total_quota: 5, registered_count: 3 },
  { id: "q2", school_id: "s1", subject: "physics", total_quota: 4, registered_count: 2 },
  { id: "q3", school_id: "s1", subject: "chemistry", total_quota: 11, registered_count: 1 },
  { id: "q4", school_id: "s2", subject: "biology", total_quota: 6, registered_count: 4 },
  { id: "q5", school_id: "s2", subject: "english", total_quota: 5, registered_count: 2 },
];

// Helper function to get school info
const getSchoolInfo = (schoolId: string, schoolsList: School[]): School | undefined => {
  return schoolsList.find(s => s.id === schoolId);
};

const QuotaManager = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuota, setEditingQuota] = useState<Quota | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [formData, setFormData] = useState<{
    school_id: string;
    subject: string;
    total_quota: number;
  }>({
    school_id: "",
    subject: "",
    total_quota: 5,
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        // Load schools from localStorage
        const savedSchools = localStorage.getItem('schools_data');
        let schoolsList: School[] = [];
        
        if (savedSchools) {
          try {
            const parsedSchools = JSON.parse(savedSchools);
            // Convert to simpler School format for dropdown
            schoolsList = parsedSchools.map((school: any) => ({
              id: school.id,
              name: school.name,
              location: school.location,
              min_gpa: school.min_gpa,
              status: school.status
            }));
          } catch (error) {
            console.error("Error parsing schools data:", error);
          }
        }
        
        setSchools(schoolsList);
        
        // Load registrations from localStorage
        const savedRegistrations = localStorage.getItem('student_registrations');
        let registrationsData: Registration[] = [];
        
        if (savedRegistrations) {
          try {
            registrationsData = JSON.parse(savedRegistrations);
          } catch (error) {
            console.error("Error parsing registrations:", error);
          }
        }
        
        setRegistrations(registrationsData);
        
        // Load quotas from localStorage
        const savedQuotas = localStorage.getItem('quotas_data');
        let quotasList: Quota[] = [];
        
        if (savedQuotas) {
          try {
            quotasList = JSON.parse(savedQuotas);
            // Validate each quota has required properties
            quotasList = quotasList.map(quota => ({
              id: quota.id || `q${Date.now()}`,
              school_id: quota.school_id || '',
              subject: quota.subject || '',
              total_quota: quota.total_quota || 0,
              registered_count: quota.registered_count || 0
            }));
          } catch (error) {
            console.error("Error parsing quotas data:", error);
            quotasList = DUMMY_QUOTAS_INITIAL;
            localStorage.setItem('quotas_data', JSON.stringify(DUMMY_QUOTAS_INITIAL));
          }
        } else {
          // If no data in localStorage, use dummy data and save it
          quotasList = DUMMY_QUOTAS_INITIAL;
          localStorage.setItem('quotas_data', JSON.stringify(DUMMY_QUOTAS_INITIAL));
        }
        
        setQuotas(quotasList);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in loadData:", error);
        toast.error("Failed to load data");
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Save quotas to localStorage whenever they change
  useEffect(() => {
    if (quotas.length > 0) {
      localStorage.setItem('quotas_data', JSON.stringify(quotas));
    }
  }, [quotas]);

  // TAMBAHKAN: Fungsi untuk sync quotas dengan registrations
  const syncQuotasWithRegistrations = () => {
    // Reset semua registered_count ke 0
    const resetQuotas = quotas.map(quota => ({
      ...quota,
      registered_count: 0
    }));

    // Hitung ulang dari registrations
    registrations.forEach(reg => {
      const quotaIndex = resetQuotas.findIndex(
        q => q.school_id === reg.school_id && q.subject === reg.subject
      );
      
      if (quotaIndex !== -1) {
        resetQuotas[quotaIndex].registered_count += 1;
      } else {
        // Jika quota belum ada, buat baru
        resetQuotas.push({
          id: `q${Date.now()}`,
          school_id: reg.school_id,
          subject: reg.subject,
          total_quota: 5, // Default value
          registered_count: 1
        });
      }
    });

    setQuotas(resetQuotas);
    localStorage.setItem('quotas_data', JSON.stringify(resetQuotas));
    
    // Update sekolah juga
    updateSchoolRegistrations();
    
    toast.success("Quotas synced with registration data");
  };

  // TAMBAHKAN: Fungsi untuk update school registrations
  const updateSchoolRegistrations = () => {
    const savedSchools = localStorage.getItem('schools_data');
    if (!savedSchools) return;
    
    try {
      const schoolsData = JSON.parse(savedSchools);
      
      // Hitung registered_students untuk setiap sekolah
      const updatedSchools = schoolsData.map((school: any) => {
        const schoolRegistrations = registrations.filter(reg => reg.school_id === school.id);
        return {
          ...school,
          registered_students: schoolRegistrations.length
        };
      });
      
      localStorage.setItem('schools_data', JSON.stringify(updatedSchools));
    } catch (error) {
      console.error("Error updating schools:", error);
    }
  };

  // Reload schools when component mounts or when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      const savedSchools = localStorage.getItem('schools_data');
      if (savedSchools) {
        try {
          const parsedSchools = JSON.parse(savedSchools);
          const simplifiedSchools: School[] = parsedSchools.map((school: any) => ({
            id: school.id,
            name: school.name,
            location: school.location,
            min_gpa: school.min_gpa,
            status: school.status
          }));
          setSchools(simplifiedSchools);
        } catch (error) {
          console.error("Error parsing schools data:", error);
        }
      }
    }
  }, [isDialogOpen]);

  // Filter quotas berdasarkan search dan subject
  const filteredQuotas = quotas.filter(quota => {
    const schoolInfo = getSchoolInfo(quota.school_id, schools);
    
    // Skip if school info not found or school is inactive
    if (!schoolInfo || schoolInfo.status === "inactive") return false;
    
    const matchesSearch = 
      schoolInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schoolInfo.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = selectedSubject === "all" || quota.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  // TAMBAHKAN: Fungsi untuk mendapatkan siswa yang terdaftar di quota tertentu
  const getStudentsForQuota = (schoolId: string, subject: string) => {
    return registrations.filter(reg => 
      reg.school_id === schoolId && reg.subject === subject
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi form
    if (!formData.school_id || !formData.subject || formData.total_quota <= 0) {
      toast.error("Please fill all fields correctly");
      return;
    }

    // Find the selected school from schools list
    const selectedSchool = getSchoolInfo(formData.school_id, schools);
    if (!selectedSchool) {
      toast.error("Selected school not found");
      return;
    }

    let updatedQuotas: Quota[];
    
    if (editingQuota) {
      // Update existing quota
      updatedQuotas = quotas.map(q => 
        q.id === editingQuota.id 
          ? { 
              ...q, 
              total_quota: formData.total_quota,
              school_id: formData.school_id,
              subject: formData.subject
            }
          : q
      );
      toast.success("Quota updated successfully");
    } else {
      // Check if quota already exists for this school and subject
      const existingQuota = quotas.find(q => 
        q.school_id === formData.school_id && q.subject === formData.subject
      );

      if (existingQuota) {
        toast.error("Quota already exists for this school and subject");
        return;
      }

      // Add new quota
      const newQuota: Quota = {
        id: `q${Date.now()}`,
        school_id: formData.school_id,
        subject: formData.subject,
        total_quota: formData.total_quota,
        registered_count: 0
      };

      updatedQuotas = [...quotas, newQuota];
      toast.success("Quota added successfully");
    }

    // Update state
    setQuotas(updatedQuotas);

    // Reset form
    setFormData({ school_id: "", subject: "", total_quota: 5 });
    setEditingQuota(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (quota: Quota) => {
    setEditingQuota(quota);
    setFormData({
      school_id: quota.school_id,
      subject: quota.subject,
      total_quota: quota.total_quota,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this quota?")) return;

    // Check if there are registrations
    const quotaToDelete = quotas.find(q => q.id === id);
    if (quotaToDelete && quotaToDelete.registered_count > 0) {
      toast.error("Cannot delete quota with existing registrations");
      return;
    }

    const updatedQuotas = quotas.filter(q => q.id !== id);
    setQuotas(updatedQuotas);
    toast.success("Quota deleted successfully");
  };

  // Calculate statistics
  const totalQuotas = quotas.reduce((sum, q) => sum + q.total_quota, 0);
  const totalRegistered = quotas.reduce((sum, q) => sum + q.registered_count, 0);
  const totalAvailable = totalQuotas - totalRegistered;
  const utilizationRate = totalQuotas > 0 ? Math.round((totalRegistered / totalQuotas) * 100) : 0;

  // Filter active schools for dropdown
  const activeSchools = schools.filter(school => {
    return school.status === "active";
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading quota data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Quota Management
          </h2>
          <p className="text-muted-foreground">Manage teaching position quotas for each school</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={syncQuotasWithRegistrations}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sync with Registrations
          </Button>
          
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingQuota(null);
                setFormData({ school_id: "", subject: "", total_quota: 5 });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Quota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingQuota ? (
                    <>
                      <Edit className="h-5 w-5" />
                      Edit Quota
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Add New Quota
                    </>
                  )}
                </DialogTitle>
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
                      {activeSchools.length > 0 ? (
                        activeSchools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            <div className="flex items-center gap-2">
                              <SchoolIcon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{school.name}</div>
                                <div className="text-xs text-muted-foreground">{school.location}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No active schools available. Add schools in School Manager first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    disabled={!!editingQuota}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
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
                    min="1"
                    max="50"
                    value={formData.total_quota}
                    onChange={(e) => setFormData({ ...formData, total_quota: parseInt(e.target.value) || 0 })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of teaching positions available
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={activeSchools.length === 0 && !editingQuota}
                >
                  {editingQuota ? "Update Quota" : "Add Quota"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sync Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 mb-1">Data Synchronization</p>
            <p className="text-sm text-blue-700">
              Quota counts are automatically calculated from student registrations. 
              Click "Sync with Registrations" to manually update quota counts.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-green-600">
                <Users className="inline h-3 w-3 mr-1" />
                {registrations.length} total student registrations
              </span>
              <span className="text-blue-600">
                <BookOpen className="inline h-3 w-3 mr-1" />
                {quotas.length} quota entries
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Quotas</p>
                <p className="text-2xl font-bold">{totalQuotas}</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Registered</p>
                <p className="text-2xl font-bold">{totalRegistered}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{totalAvailable}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <BookOpen className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilization Rate</p>
                <p className="text-2xl font-bold">{utilizationRate}%</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <div className="h-5 w-5 text-orange-500 font-bold">%</div>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${utilizationRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by school name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.value} value={subject.value}>
                  {subject.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quotas List */}
      <div className="grid gap-4">
        {filteredQuotas.length > 0 ? (
          filteredQuotas.map((quota) => {
            const available = quota.total_quota - quota.registered_count;
            const fillPercentage = Math.round((quota.registered_count / quota.total_quota) * 100);
            const school = getSchoolInfo(quota.school_id, schools);
            const students = getStudentsForQuota(quota.school_id, quota.subject);

            // Skip rendering if school info is missing
            if (!school) return null;

            return (
              <Card key={quota.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <SchoolIcon className="h-5 w-5 text-primary" />
                        {school.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{school.location}</span>
                        {school.min_gpa && (
                          <>
                            <span className="text-xs">•</span>
                            <Badge variant="outline" className="text-xs">
                              Min GPA: {school.min_gpa}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(quota)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDelete(quota.id)}
                        disabled={quota.registered_count > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm">
                          {quota.subject.charAt(0).toUpperCase() + quota.subject.slice(1)}
                        </Badge>
                        <Badge variant={available > 0 ? "success" : "destructive"}>
                          {available > 0 ? `${available} Available` : "Full"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{quota.registered_count}</div>
                        <div className="text-xs text-muted-foreground">
                          {students.length} student{students.length !== 1 ? 's' : ''} registered
                        </div>
                      </div>
                    </div>

                    {/* Student List (if any) */}
                    {students.length > 0 && (
                      <div className="bg-muted/30 p-3 rounded">
                        <p className="text-xs font-medium mb-2">Registered Students:</p>
                        <div className="space-y-1">
                          {students.slice(0, 3).map((student, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="truncate">{student.student_name}</span>
                              <code className="text-xs bg-background px-1.5 py-0.5 rounded">
                                {student.student_id}
                              </code>
                            </div>
                          ))}
                          {students.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              + {students.length - 3} more student{students.length - 3 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-medium">
                          {quota.registered_count} / {quota.total_quota} slots
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-muted">
                            {fillPercentage}% filled
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            fillPercentage >= 90 ? "bg-red-500" :
                            fillPercentage >= 70 ? "bg-yellow-500" :
                            fillPercentage >= 50 ? "bg-green-500" :
                            "bg-blue-500"
                          }`}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{quota.registered_count} filled</span>
                        <span>{available} available</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold mb-2">No quotas found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedSubject !== "all" 
                  ? "Try adjusting your search filters" 
                  : "Add your first quota to get started"}
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Quota
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold mb-1">Quota Summary</h4>
              <p className="text-sm text-muted-foreground">
                Showing {filteredQuotas.length} of {quotas.length} quotas
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                <Users className="inline h-3 w-3 mr-1" />
                Based on {registrations.length} student registrations
              </div>
            </div>
            <div className="text-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold">{totalQuotas}</div>
                  <div className="text-xs text-muted-foreground">Total Slots</div>
                </div>
                <div>
                  <div className="font-bold">{totalRegistered}</div>
                  <div className="text-xs text-muted-foreground">Filled</div>
                </div>
                <div>
                  <div className="font-bold">{utilizationRate}%</div>
                  <div className="text-xs text-muted-foreground">Utilization</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotaManager;