import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  School as SchoolIcon, 
  BookOpen, 
  BarChart3, 
  TrendingUp, 
  Download,
  Calendar,
  UserCheck,
  UserX,
  Filter,
  Trash2,
  RefreshCw,
  AlertCircle,
  Phone,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Registration {
  school_id: string;
  subject: string;
  timestamp: string;
  student_id: string;
  student_name: string;
  student_gpa: number;
  microteaching_grade: string;
}

interface SchoolData {
  id: string;
  name: string;
  location: string;
  min_gpa: number;
  total_quotas: number;
  registered_students: number;
  status: "active" | "inactive";
}

const RegistrationStats = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // WhatsApp contact for admin
  const adminWhatsApp = "+6281234567890";

  // Helper function for safe toFixed
  const safeToFixed = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.00";
    }
    return value.toFixed(decimals);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Load registrations from localStorage
      const savedRegistrations = localStorage.getItem('student_registrations');
      let registrationsData: Registration[] = [];
      
      if (savedRegistrations) {
        try {
          registrationsData = JSON.parse(savedRegistrations);
          
          // Clean data - ensure all required fields exist
          registrationsData = registrationsData.map(reg => ({
            ...reg,
            student_gpa: reg.student_gpa || 0,
            microteaching_grade: reg.microteaching_grade || "N/A",
            subject: reg.subject || "unknown",
            student_name: reg.student_name || "Unknown Student",
            student_id: reg.student_id || "N/A"
          }));
        } catch (error) {
          console.error("Error parsing registrations:", error);
          registrationsData = [];
        }
      }

      // Load schools for school names
      const savedSchools = localStorage.getItem('schools_data');
      let schoolsData: SchoolData[] = [];
      
      if (savedSchools) {
        try {
          schoolsData = JSON.parse(savedSchools);
          
          // Clean school data
          schoolsData = schoolsData.map(school => ({
            ...school,
            registered_students: school.registered_students || 0,
            min_gpa: school.min_gpa || 0,
            total_quotas: school.total_quotas || 0,
            status: school.status || "inactive"
          }));
        } catch (error) {
          console.error("Error parsing schools:", error);
          schoolsData = [];
        }
      }

      setRegistrations(registrationsData);
      setSchools(schoolsData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error in loadData:", error);
      toast.error("Failed to load registration data");
      setIsLoading(false);
    }
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const school = schools.find(s => s.id === reg.school_id);
    if (!school) return false;
    
    const matchesSchool = filterSchool === "all" || reg.school_id === filterSchool;
    const matchesSubject = filterSubject === "all" || reg.subject === filterSubject;
    const matchesSearch = 
      (reg.student_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.student_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (school.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSchool && matchesSubject && matchesSearch;
  });

  // Statistics calculations
  const stats = {
    totalRegistrations: registrations.length,
    uniqueStudents: new Set(registrations.map(r => r.student_id)).size,
    uniqueSchools: new Set(registrations.map(r => r.school_id)).size,
    avgGpa: registrations.length > 0 
      ? safeToFixed(
          registrations.reduce((sum, r) => sum + (r.student_gpa || 0), 0) / registrations.length
        )
      : "0.00"
  };

  // Subject distribution dengan null safety
  const subjectDistribution = registrations.reduce((acc, reg) => {
    const subject = reg.subject || "unknown";
    
    if (!acc[subject]) {
      acc[subject] = { count: 0, subject: subject };
    }
    acc[subject].count++;
    return acc;
  }, {} as Record<string, { count: number; subject: string }>);

  // School distribution dengan null safety
  const schoolDistribution = registrations.reduce((acc, reg) => {
    const school = schools.find(s => s.id === reg.school_id);
    const schoolName = school?.name || "Unknown School";
    
    if (!acc[schoolName]) {
      acc[schoolName] = { count: 0, name: schoolName };
    }
    acc[schoolName].count++;
    return acc;
  }, {} as Record<string, { count: number; name: string }>);

  // Reset all registration data
  const handleResetAllData = () => {
    if (!confirm("Are you sure you want to reset ALL registration data? This action cannot be undone and will delete ALL student registrations.")) {
      return;
    }

    // Clear all registrations
    localStorage.removeItem('student_registrations');
    
    // Reset quota counts
    const savedQuotas = localStorage.getItem('quotas_data');
    if (savedQuotas) {
      try {
        const quotas = JSON.parse(savedQuotas);
        const resetQuotas = quotas.map((quota: any) => ({
          ...quota,
          registered_count: 0
        }));
        localStorage.setItem('quotas_data', JSON.stringify(resetQuotas));
      } catch (error) {
        console.error("Error resetting quotas:", error);
      }
    }

    // Reset school registered_students
    const savedSchools = localStorage.getItem('schools_data');
    if (savedSchools) {
      try {
        const schoolsData = JSON.parse(savedSchools);
        const resetSchools = schoolsData.map((school: any) => ({
          ...school,
          registered_students: 0
        }));
        localStorage.setItem('schools_data', JSON.stringify(resetSchools));
      } catch (error) {
        console.error("Error resetting schools:", error);
      }
    }

    setRegistrations([]);
    setShowResetConfirm(false);
    toast.success("All registration data has been reset");
  };

  // Delete single registration
  const handleDeleteRegistration = (studentId: string) => {
    const registration = registrations.find(r => r.student_id === studentId);
    if (!registration) return;

    if (!confirm(`Delete registration for ${registration.student_name} (${registration.student_id})?`)) {
      return;
    }

    // Remove from registrations
    const updatedRegistrations = registrations.filter(r => r.student_id !== studentId);
    setRegistrations(updatedRegistrations);
    localStorage.setItem('student_registrations', JSON.stringify(updatedRegistrations));

    // Update quota count
    const savedQuotas = localStorage.getItem('quotas_data');
    if (savedQuotas) {
      try {
        const quotas = JSON.parse(savedQuotas);
        const updatedQuotas = quotas.map((quota: any) => {
          if (quota.school_id === registration.school_id && quota.subject === registration.subject) {
            return {
              ...quota,
              registered_count: Math.max(0, quota.registered_count - 1)
            };
          }
          return quota;
        });
        localStorage.setItem('quotas_data', JSON.stringify(updatedQuotas));
      } catch (error) {
        console.error("Error updating quotas:", error);
      }
    }

    // Update school registered_students
    const savedSchools = localStorage.getItem('schools_data');
    if (savedSchools) {
      try {
        const schoolsData = JSON.parse(savedSchools);
        const updatedSchools = schoolsData.map((school: any) => {
          if (school.id === registration.school_id) {
            return {
              ...school,
              registered_students: Math.max(0, school.registered_students - 1)
            };
          }
          return school;
        });
        localStorage.setItem('schools_data', JSON.stringify(updatedSchools));
      } catch (error) {
        console.error("Error updating schools:", error);
      }
    }

    toast.success("Registration deleted successfully");
  };

  const handleExportData = () => {
    try {
      if (filteredRegistrations.length === 0) {
        toast.error("No data to export");
        return;
      }

      const exportData = filteredRegistrations.map(reg => {
        const school = schools.find(s => s.id === reg.school_id);
        return {
          StudentID: reg.student_id,
          StudentName: reg.student_name,
          GPA: safeToFixed(reg.student_gpa),
          MicroteachingGrade: reg.microteaching_grade,
          School: school?.name || "Unknown",
          Location: school?.location || "Unknown",
          Subject: (reg.subject?.charAt(0).toUpperCase() || '') + (reg.subject?.slice(1) || ''),
          RegistrationDate: new Date(reg.timestamp).toLocaleString()
        };
      });

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleRefresh = () => {
    loadData();
    toast.success("Data refreshed");
  };

  const handleContactStudent = (studentPhone: string, studentName: string) => {
    const message = `Hello ${studentName}, this is regarding your Field Experience registration.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${studentPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // FUNGSI AMAN untuk menghitung persentase
  const safeCalculatePercentage = (count: number, total: number): number => {
    if (total === 0 || count === 0) return 0;
    return (count / total) * 100;
  };

  // FUNGSI AMAN untuk memformat persentase
  const safeFormatPercentage = (percentage: number): string => {
    if (percentage === undefined || percentage === null || isNaN(percentage)) {
      return "0.0";
    }
    return percentage.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading registration data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Registration Management
          </h2>
          <p className="text-muted-foreground">Manage and monitor student registrations</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExportData} className="gap-2" disabled={filteredRegistrations.length === 0}>
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Registrations</p>
                <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.uniqueStudents} students</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Schools Used</p>
                <p className="text-2xl font-bold">{stats.uniqueSchools}</p>
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Active schools
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <SchoolIcon className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Student GPA</p>
                <p className="text-2xl font-bold">{stats.avgGpa}</p>
                <p className="text-xs text-muted-foreground mt-1">Overall average</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <span className="h-5 w-5 text-purple-500 font-bold">GPA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Registration Status</p>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground mt-1">All registrations permanent</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
                <UserCheck className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            Administrative Actions
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Dangerous actions - use with caution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Reset All Registration Data</p>
              <p className="text-xs text-red-700 dark:text-red-400">
                This will delete ALL student registrations and reset all counters to zero.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setShowResetConfirm(true)}
              className="gap-2"
              disabled={registrations.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Reset All Data
            </Button>
          </div>

          {showResetConfirm && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-300 mb-2">Confirm Complete Reset</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                    This will permanently delete ALL {registrations.length} student registrations. 
                    Quota counts and school registrations will be reset to zero.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleResetAllData}
                      className="gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Yes, Reset Everything
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Registrations
          </CardTitle>
          <CardDescription>Filter registration data by school or subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>School</Label>
              <Select value={filterSchool} onValueChange={setFilterSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="All schools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.filter(s => s.status === "active").map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="indonesian">Indonesian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name, ID, or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRegistrations.length} of {registrations.length} registrations
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setFilterSchool("all");
                setFilterSubject("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registration Details Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registration Details</CardTitle>
              <CardDescription>Complete list of all student registrations</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Student</th>
                    <th className="text-left py-3 px-2 font-medium">ID</th>
                    <th className="text-left py-3 px-2 font-medium">School</th>
                    <th className="text-left py-3 px-2 font-medium">Subject</th>
                    <th className="text-left py-3 px-2 font-medium">GPA / Grade</th>
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => {
                    const school = schools.find(s => s.id === reg.school_id);
                    const registrationDate = reg.timestamp ? new Date(reg.timestamp) : new Date();
                    
                    return (
                      <tr key={`${reg.student_id}-${reg.school_id}-${reg.subject}`} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="font-medium">{reg.student_name}</div>
                        </td>
                        <td className="py-3 px-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{reg.student_id}</code>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-medium">{school?.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{school?.location || ""}</div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="capitalize">
                            {reg.subject}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-medium text-primary">{safeToFixed(reg.student_gpa, 2)} GPA</div>
                          <div className="text-xs text-muted-foreground">
                            Micro: {reg.microteaching_grade}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-sm">{registrationDate.toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {registrationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleContactStudent(adminWhatsApp, reg.student_name)}
                              title="Contact via WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(`tel:${adminWhatsApp}`, '_self')}
                              title="Call Student"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRegistration(reg.student_id)}
                              title="Delete Registration"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No registrations found</p>
              <p className="text-sm mt-1">
                {searchQuery || filterSchool !== "all" || filterSubject !== "all"
                  ? "Try adjusting your filters"
                  : "No student registrations yet"
                }
              </p>
            </div>
          )}
          
          {/* Summary */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  Total: {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? 's' : ''}
                </p>
                {filterSchool !== "all" && (
                  <p>
                    Filtered by: {schools.find(s => s.id === filterSchool)?.name || "Selected School"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportData}
                  disabled={filteredRegistrations.length === 0}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export Filtered Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distributions - DIPERBAIKI dengan safety check lengkap */}
      {registrations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Distribution */}
          {Object.keys(subjectDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Registrations by teaching subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(subjectDistribution)
                    .filter(subject => subject.count > 0)
                    .map((subject) => {
                      const percentage = safeCalculatePercentage(subject.count, stats.totalRegistrations);
                      const formattedPercentage = safeFormatPercentage(percentage);
                      
                      return (
                        <div key={subject.subject} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium capitalize">{subject.subject}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">{subject.count}</span>
                              <span className="text-muted-foreground ml-2">
                                ({formattedPercentage}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* School Distribution */}
          {Object.keys(schoolDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>School Distribution</CardTitle>
                <CardDescription>Registrations by school</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {Object.values(schoolDistribution)
                    .filter(school => school.count > 0)
                    .map((school) => {
                      const percentage = safeCalculatePercentage(school.count, stats.totalRegistrations);
                      const formattedPercentage = safeFormatPercentage(percentage);
                      
                      return (
                        <div key={school.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <SchoolIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium truncate">{school.name}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">{school.count}</span>
                              <span className="text-muted-foreground ml-2">
                                ({formattedPercentage}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistrationStats;