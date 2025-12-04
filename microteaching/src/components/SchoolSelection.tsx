import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School, Search, ArrowLeft, CheckCircle, MapPin, Target, AlertCircle, BookOpen, UserCheck, Calendar, MessageCircle, Phone, RefreshCw, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SchoolData {
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

interface QuotaData {
  id: string;
  school_id: string;
  subject: string;
  total_quota: number;
  registered_count: number;
}

interface SchoolQuota {
  id: string;
  school_id: string;
  subject: string;
  total_quota: number;
  registered_count: number;
  schools: {
    id: string;
    name: string;
    location: string;
    min_gpa?: number;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    status?: "active" | "inactive";
  };
}

interface GroupedSchool {
  id: string;
  name: string;
  location: string;
  min_gpa: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: "active" | "inactive";
  subjects: {
    quotaId: string;
    subject: string;
    total_quota: number;
    registered_count: number;
  }[];
}

interface SchoolSelectionProps {
  studentData: { id: string; name: string; hasMicroteaching: boolean; microteachingGrade: string; gpa: number };
  onComplete: () => void;
  onBack: () => void;
}

interface Registration {
  school_id: string;
  subject: string;
  timestamp: string;
  student_id: string;
  student_name: string;
  student_gpa: number;
  microteaching_grade: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed"; // NEW: Added status field
  id?: string; // NEW: Added optional id field
  updated_at?: string; // NEW: Added update timestamp
  reviewed_at?: string; // NEW: Added review timestamp
}

const subjects = [
  { value: "chemistry", label: "Chemistry" },
  { value: "math", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English" },
  { value: "indonesian", label: "Indonesian" },
];

// Data dummy fallback jika localStorage kosong
const DUMMY_SCHOOLS: SchoolData[] = [
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
    id: "s9", 
    name: "SMA Negeri 1 Bandung", 
    location: "Bandung", 
    min_gpa: 3.2, 
    latitude: -6.9220, 
    longitude: 107.6065,
    address: "Jl. Ir. H. Juanda No. 93, Bandung",
    status: "active",
    established_year: 1950,
    total_quotas: 5,
    registered_students: 2
  },
];

const DUMMY_QUOTAS: QuotaData[] = [
  { id: "q1", school_id: "s1", subject: "math", total_quota: 5, registered_count: 3 },
  { id: "q2", school_id: "s1", subject: "physics", total_quota: 4, registered_count: 2 },
  { id: "q3", school_id: "s1", subject: "chemistry", total_quota: 11, registered_count: 1 },
  { id: "q4", school_id: "s2", subject: "biology", total_quota: 6, registered_count: 4 },
  { id: "q5", school_id: "s2", subject: "english", total_quota: 5, registered_count: 2 },
  { id: "q6", school_id: "s9", subject: "chemistry", total_quota: 5, registered_count: 2 },
];

const SchoolSelection = ({ studentData, onComplete, onBack }: SchoolSelectionProps) => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [quotas, setQuotas] = useState<QuotaData[]>([]);
  const [combinedQuotas, setCombinedQuotas] = useState<SchoolQuota[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<GroupedSchool | null>(null);
  const [selectedSubjectForSchool, setSelectedSubjectForSchool] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<"all" | "chemistry" | "math" | "physics" | "biology" | "english" | "indonesian">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [studentRegistration, setStudentRegistration] = useState<Registration | null>(null);

  // WhatsApp contact for help
  const adminWhatsApp = "+6281234567890"; // Ganti dengan nomor admin
  const helpMessage = `Halo Admin, saya ${studentData.name} (ID: ${studentData.id}) butuh bantuan terkait pendaftaran Field Experience.`;

  // Status colors for badges
  const STATUS_COLORS = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
    Approved: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    Rejected: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
    Completed: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100'
  };

  const STATUS_LABELS = {
    Pending: "Pending Review",
    Approved: "Approved - Active",
    Rejected: "Rejected",
    Completed: "Completed"
  };

  // Status icons
  const getStatusIcon = (status: Registration['status']) => {
    switch(status) {
      case 'Pending': return <Clock className="h-3 w-3" />;
      case 'Approved': return <CheckCircle className="h-3 w-3" />;
      case 'Completed': return <UserCheck className="h-3 w-3" />;
      case 'Rejected': return <ShieldAlert className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Load data from localStorage
  const loadData = () => {
    try {
      setIsLoading(true);
      
      // Load schools from localStorage
      const savedSchools = localStorage.getItem('schools_data');
      let schoolsData: SchoolData[] = [];
      
      if (savedSchools) {
        try {
          schoolsData = JSON.parse(savedSchools);
          
          // Pastikan semua sekolah memiliki status dan data lengkap
          schoolsData = schoolsData.map(school => ({
            ...school,
            status: school.status || "active",
            min_gpa: school.min_gpa || 0,
            total_quotas: school.total_quotas || 0,
            registered_students: school.registered_students || 0,
            name: school.name || "Unknown School",
            location: school.location || "Unknown Location",
            address: school.address || null,
            latitude: school.latitude || null,
            longitude: school.longitude || null,
            established_year: school.established_year || new Date().getFullYear()
          }));
          
        } catch (error) {
          console.error("Error parsing schools:", error);
          schoolsData = DUMMY_SCHOOLS.filter(s => s.status === "active");
        }
      } else {
        // Jika tidak ada data, gunakan dummy data yang aktif saja
        schoolsData = DUMMY_SCHOOLS.filter(s => s.status === "active");
        localStorage.setItem('schools_data', JSON.stringify(DUMMY_SCHOOLS));
      }

      // Load quotas from localStorage
      const savedQuotas = localStorage.getItem('quotas_data');
      let quotasData: QuotaData[] = [];
      
      if (savedQuotas) {
        try {
          quotasData = JSON.parse(savedQuotas);
        } catch (error) {
          console.error("Error parsing quotas:", error);
          quotasData = DUMMY_QUOTAS;
        }
      } else {
        quotasData = DUMMY_QUOTAS;
        localStorage.setItem('quotas_data', JSON.stringify(DUMMY_QUOTAS));
      }

      // Load student registrations from localStorage
      const savedRegistrations = localStorage.getItem('student_registrations');
      let registrationsData: Registration[] = [];
      
      if (savedRegistrations) {
        try {
          registrationsData = JSON.parse(savedRegistrations);
          
          // Pastikan semua registrasi memiliki status
          registrationsData = registrationsData.map(reg => ({
            ...reg,
            status: reg.status || "Pending", // Default to pending if not set
            id: reg.id || `${reg.student_id}-${reg.school_id}`,
            updated_at: reg.updated_at || reg.timestamp,
            reviewed_at: reg.reviewed_at || null
          }));
          
        } catch (error) {
          console.error("Error parsing registrations:", error);
          registrationsData = [];
        }
      }

      setSchools(schoolsData);
      setQuotas(quotasData);
      setRegistrations(registrationsData);

      // Cari registrasi untuk siswa ini
      const studentReg = registrationsData.find(reg => reg.student_id === studentData.id);
      setStudentRegistration(studentReg || null);

      // Combine schools and quotas - hanya untuk sekolah aktif
      const activeSchoolIds = schoolsData.filter(s => s.status === "active").map(s => s.id);
      const combined = quotasData
        .filter(quota => activeSchoolIds.includes(quota.school_id))
        .map(quota => {
          const school = schoolsData.find(s => s.id === quota.school_id);
          if (!school) return null;

          return {
            id: quota.id,
            school_id: quota.school_id,
            subject: quota.subject,
            total_quota: quota.total_quota,
            registered_count: quota.registered_count,
            schools: {
              id: school.id,
              name: school.name,
              location: school.location,
              min_gpa: school.min_gpa,
              latitude: school.latitude,
              longitude: school.longitude,
              address: school.address,
              status: school.status
            }
          };
        })
        .filter(Boolean) as SchoolQuota[];

      setCombinedQuotas(combined);
      setIsLoading(false);
    } catch (error) {
      console.error("Error in loadData:", error);
      toast.error("Failed to load school data");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load data pertama kali
    const timer = setTimeout(() => {
      loadData();
    }, 800);

    // Tambahkan event listener untuk storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'schools_data' || e.key === 'quotas_data' || e.key === 'student_registrations') {
        console.log('Storage changed, reloading data...');
        loadData();
      }
    };

    // Tambahkan custom event listener untuk perubahan dalam aplikasi yang sama
    const handleCustomStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('schoolDataChanged', handleCustomStorageChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('schoolDataChanged', handleCustomStorageChange);
    };
  }, [studentData.id]);

  // Refresh data when selected subject changes
  useEffect(() => {
    if (!isLoading) {
      fetchQuotas();
    }
  }, [selectedSubject, schools, quotas]);

  const fetchQuotas = () => {
    // Filter data based on selected subject
    let filteredQuotas = combinedQuotas;
    
    if (selectedSubject !== "all") {
      filteredQuotas = combinedQuotas.filter(
        quota => quota.subject === selectedSubject
      );
    }

    // Only show active schools
    filteredQuotas = filteredQuotas.filter(quota => quota.schools.status === "active");

    setCombinedQuotas(filteredQuotas);
  };

  // Group quotas by school
  const groupedSchools = combinedQuotas.reduce((acc, quota) => {
    const schoolId = quota.school_id;
    if (!acc[schoolId]) {
      acc[schoolId] = {
        id: quota.schools.id,
        name: quota.schools.name,
        location: quota.schools.location,
        min_gpa: quota.schools.min_gpa || 0,
        latitude: quota.schools.latitude || null,
        longitude: quota.schools.longitude || null,
        address: quota.schools.address || null,
        status: quota.schools.status || "active",
        subjects: [],
      };
    }
    acc[schoolId].subjects.push({
      quotaId: quota.id,
      subject: quota.subject,
      total_quota: quota.total_quota,
      registered_count: quota.registered_count,
    });
    return acc;
  }, {} as Record<string, GroupedSchool>);

  // Get all active schools with their subjects
  const availableSchools = schools
    .filter(school => school.status === "active") // Hanya sekolah aktif
    .filter(school => {
      const schoolName = school.name || "";
      const schoolLocation = school.location || "";
      const matchesSearch = 
        schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schoolLocation.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    })
    .map(school => {
      // Get subjects for this school from combinedQuotas
      const schoolSubjects = combinedQuotas
        .filter(quota => quota.school_id === school.id)
        .map(quota => ({
          quotaId: quota.id,
          subject: quota.subject,
          total_quota: quota.total_quota,
          registered_count: quota.registered_count,
        }));

      // Filter by selected subject if not "all"
      const filteredSubjects = selectedSubject === "all" 
        ? schoolSubjects 
        : schoolSubjects.filter(subj => subj.subject === selectedSubject);

      return {
        id: school.id,
        name: school.name,
        location: school.location,
        min_gpa: school.min_gpa,
        latitude: school.latitude,
        longitude: school.longitude,
        address: school.address,
        status: school.status,
        subjects: filteredSubjects
      } as GroupedSchool;
    })
    .filter(school => {
      // Filter out schools with no subjects (when filtered by subject)
      if (selectedSubject !== "all") {
        return school.subjects.length > 0;
      }
      return true;
    });

  const handleRegister = async () => {
    if (!selectedSchool || !selectedSubjectForSchool) return;

    // Check if student already registered
    if (studentRegistration) {
      toast.error("You are already registered and cannot register again");
      return;
    }

    setIsRegistering(true);

    try {
      // Simulasi delay registrasi
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Periksa apakah sudah terdaftar di sekolah lain
      const alreadyRegistered = registrations.some(
        reg => reg.student_id === studentData.id
      );

      if (alreadyRegistered) {
        toast.error("You have already registered for a school");
        setIsRegistering(false);
        return;
      }

      // Periksa apakah kuota masih tersedia
      const selectedSubjectData = selectedSchool.subjects.find(
        subj => subj.subject === selectedSubjectForSchool
      );

      if (!selectedSubjectData) {
        toast.error("Subject not available");
        setIsRegistering(false);
        return;
      }

      const available = selectedSubjectData.total_quota - selectedSubjectData.registered_count;
      if (available <= 0) {
        toast.error("This subject quota is already full");
        setIsRegistering(false);
        return;
      }

      // Periksa apakah memenuhi GPA requirement
      if (studentData.gpa < selectedSchool.min_gpa) {
        toast.error("GPA requirement not met", {
          description: `Minimum GPA required: ${selectedSchool.min_gpa.toFixed(1)}`
        });
        setIsRegistering(false);
        return;
      }

      // Create new registration dengan status "pending"
      const newRegistration: Registration = {
        school_id: selectedSchool.id,
        subject: selectedSubjectForSchool,
        timestamp: new Date().toISOString(),
        student_id: studentData.id,
        student_name: studentData.name,
        student_gpa: studentData.gpa,
        microteaching_grade: studentData.microteachingGrade,
        status: "Pending", // NEW: Set status to pending
        id: `${studentData.id}-${selectedSchool.id}`, // Generate ID
        updated_at: new Date().toISOString(),
        reviewed_at: null // Belum direview oleh admin
      };

      // Update registrations in localStorage
      const updatedRegistrations = [...registrations, newRegistration];
      setRegistrations(updatedRegistrations);
      setStudentRegistration(newRegistration);
      localStorage.setItem('student_registrations', JSON.stringify(updatedRegistrations));

      // Update quota registered_count in localStorage
      const updatedQuotas = quotas.map(quota => {
        if (quota.school_id === selectedSchool.id && quota.subject === selectedSubjectForSchool) {
          return {
            ...quota,
            registered_count: quota.registered_count + 1
          };
        }
        return quota;
      });

      setQuotas(updatedQuotas);
      localStorage.setItem('quotas_data', JSON.stringify(updatedQuotas));

      // Update school registered_students in localStorage
      const updatedSchools = schools.map(school => {
        if (school.id === selectedSchool.id) {
          return {
            ...school,
            registered_students: school.registered_students + 1
          };
        }
        return school;
      });

      setSchools(updatedSchools);
      localStorage.setItem('schools_data', JSON.stringify(updatedSchools));

      // Trigger custom event untuk update data real-time
      window.dispatchEvent(new Event('schoolDataChanged'));

      // Update combined quotas for immediate UI update
      const updatedCombinedQuotas = combinedQuotas.map(quota => {
        if (quota.school_id === selectedSchool.id && quota.subject === selectedSubjectForSchool) {
          return {
            ...quota,
            registered_count: quota.registered_count + 1
          };
        }
        return quota;
      });

      setCombinedQuotas(updatedCombinedQuotas);

      toast.success("Registration submitted successfully!", {
        description: `Your registration for ${selectedSubjectForSchool} at ${selectedSchool.name} is now pending admin approval.`
      });

      setIsRegistering(false);
      setShowSuccessAnimation(true);
      
      setTimeout(() => {
        setShowSuccessAnimation(false);
        onComplete();
      }, 2500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : typeof error === "string" ? error : "Please try again later";
      toast.error("Registration failed", {
        description: message,
      });
      setIsRegistering(false);
    }
  };

  // Fungsi untuk mendapatkan status kuota dengan detail yang jelas
  const getQuotaStatus = (subject: { total_quota: number; registered_count: number }) => {
    const available = subject.total_quota - subject.registered_count;
    const fillPercentage = (subject.registered_count / subject.total_quota) * 100;
    
    if (available === 0) {
      return { 
        color: "destructive", 
        label: "Full", 
        description: "No slots available",
        badgeColor: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
      };
    }
    if (available <= 2) {
      return { 
        color: "warning", 
        label: "Limited", 
        description: `${available} slot${available > 1 ? 's' : ''} left`,
        badgeColor: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
      };
    }
    if (fillPercentage > 80) {
      return { 
        color: "warning", 
        label: "Almost Full", 
        description: `${available} slots available`,
        badgeColor: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
      };
    }
    return { 
      color: "success", 
      label: "Available", 
      description: `${available} slots available`,
      badgeColor: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
    };
  };

  // Fungsi untuk mendapatkan warna progress bar berdasarkan ketersediaan
  const getProgressBarColor = (subject: { total_quota: number; registered_count: number }) => {
    const available = subject.total_quota - subject.registered_count;
    const fillPercentage = (subject.registered_count / subject.total_quota) * 100;
    
    if (available === 0) return "bg-red-500";
    if (available <= 2) return "bg-amber-500";
    if (fillPercentage > 80) return "bg-amber-500";
    return "bg-green-500";
  };

  // Fungsi untuk memformat tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fungsi untuk membuka WhatsApp
  const openWhatsAppHelp = () => {
    const encodedMessage = encodeURIComponent(helpMessage);
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Fungsi untuk membuka telepon
  const openPhoneCall = () => {
    window.open(`tel:${adminWhatsApp}`, '_self');
  };

  // Fungsi untuk refresh data
  const handleRefreshData = () => {
    setIsLoading(true);
    loadData();
    toast.success("Data refreshed");
  };

  const registrationInfo = studentRegistration ? {
    schoolName: schools.find(s => s.id === studentRegistration.school_id)?.name || "Unknown School",
    schoolLocation: schools.find(s => s.id === studentRegistration.school_id)?.location || "Unknown Location",
    subject: studentRegistration.subject.charAt(0).toUpperCase() + studentRegistration.subject.slice(1),
    registrationDate: formatDate(studentRegistration.timestamp),
    reviewDate: studentRegistration.reviewed_at ? formatDate(studentRegistration.reviewed_at) : null,
    schoolId: studentRegistration.school_id,
    subjectValue: studentRegistration.subject,
    status: studentRegistration.status
  } : null;

  // Fungsi untuk mendapatkan warna status
  const getStatusColor = (status: Registration['status']) => {
    switch(status) {
      case 'Pending': return 'amber';
      case 'Approved': return 'green';
      case 'Rejected': return 'red';
      case 'Completed': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-4 animate-scale-in">
            <div className="mx-auto w-24 h-24 rounded-full bg-success/20 flex items-center justify-center">
              <Clock className="w-16 h-16 text-amber-500 animate-scale-in" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Registration Submitted!</h2>
            <p className="text-muted-foreground">Your registration is now pending admin approval.</p>
            <p className="text-sm text-muted-foreground">
              {selectedSchool?.name} - {selectedSubjectForSchool?.charAt(0).toUpperCase() + selectedSubjectForSchool?.slice(1)}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Please wait for admin review. You'll be notified when your status changes.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Student Info & Status */}
        <Card className={`${studentRegistration ? (studentRegistration.status === 'Approved' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : studentRegistration.status === 'Pending' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : 'border-blue-200 bg-blue-50 dark:bg-blue-950/20') : 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`${studentRegistration ? (studentRegistration.status === 'Approved' ? 'bg-green-100 dark:bg-green-900/40' : studentRegistration.status === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-blue-100 dark:bg-blue-900/40') : 'bg-blue-100 dark:bg-blue-900/40'} p-3 rounded-full`}>
                  {studentRegistration ? (
                    studentRegistration.status === 'Approved' ? (
                      <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : studentRegistration.status === 'Pending' ? (
                      <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )
                  ) : (
                    <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm text-muted-foreground">Student Registration Status</p>
                    {studentRegistration ? (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${STATUS_COLORS[studentRegistration.status]} flex items-center gap-1`}
                      >
                        {getStatusIcon(studentRegistration.status)}
                        {STATUS_LABELS[studentRegistration.status]}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        NOT REGISTERED
                      </Badge>
                    )}
                  </div>
                  
                  <p className="font-semibold text-lg">{studentData.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">ID: {studentData.id}</p>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-center">
                      <div className="text-xs text-muted-foreground">GPA</div>
                      <div className="font-bold text-primary">{studentData.gpa.toFixed(2)}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-center">
                      <div className="text-xs text-muted-foreground">Microteaching</div>
                      <div className="font-bold text-success">{studentData.microteachingGrade}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border text-center">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="font-bold capitalize">{studentRegistration?.status || "Not Registered"}</div>
                    </div>
                  </div>

                  {/* Registration Details */}
                  {studentRegistration ? (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          {studentRegistration.status === 'Approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : studentRegistration.status === 'Pending' ? (
                            <Clock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-blue-500" />
                          )}
                          {studentRegistration.status === 'Approved' ? 'Active Registration' : 
                           studentRegistration.status === 'Pending' ? 'Pending Registration' : 
                           'Registration Status'}
                        </h4>
                        <Badge variant={studentRegistration.status === 'Approved' ? "success" : studentRegistration.status === 'Pending' ? "secondary" : "outline"} className="text-xs">
                          {studentRegistration.status === 'Approved' ? 'Active' : 
                           studentRegistration.status === 'Pending' ? 'Pending Review' : 
                           studentRegistration.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          <span className="font-medium">{registrationInfo?.schoolName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{registrationInfo?.schoolLocation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Subject: <span className="font-medium">{registrationInfo?.subject}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Submitted: {registrationInfo?.registrationDate}
                          </span>
                        </div>
                        {studentRegistration.status !== 'Pending' && registrationInfo?.reviewDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Reviewed: {registrationInfo.reviewDate}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Information */}
                      {studentRegistration.status === 'Pending' && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-amber-800 dark:text-amber-300">Awaiting Admin Approval</p>
                              <p className="text-amber-700 dark:text-amber-400">
                                Your registration is currently being reviewed by an administrator. 
                                You will be notified once it has been approved or rejected.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {studentRegistration.status === 'Rejected' && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-start gap-2">
                            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-red-800 dark:text-red-300">Registration Rejected</p>
                              <p className="text-red-700 dark:text-red-400">
                                Your registration has been rejected by the administrator. 
                                Please contact admin for more information.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Help Section */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Need help with your registration?</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={openWhatsAppHelp}
                            className="flex-1 gap-2"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp Admin
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={openPhoneCall}
                            className="flex-1 gap-2"
                          >
                            <Phone className="h-3 w-3" />
                            Call Admin
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <h4 className="font-semibold">Registration Required</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        You have not registered for any school yet. Please select a school and subject below to register.
                        <span className="block mt-1 text-xs text-amber-600">
                          Note: After registration, your application will be pending admin approval.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefreshData} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Banner */}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">Important Information</h4>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                <li>• Each student can only register for <strong>ONE school and ONE subject</strong></li>
                <li>• After registration, your application will be in <strong>"Pending" status</strong></li>
                <li>• Admin will review and change status to <strong>"Approved - Active"</strong> or <strong>"Rejected"</strong></li>
                <li>• Only <strong>Approved</strong> registrations are considered active</li>
                <li>• Make sure your GPA meets the school's minimum requirement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Only show selection if not registered */}
        {!studentRegistration ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Your School & Subject</CardTitle>
              <CardDescription>
                Choose a school and teaching subject for your Field Experience Practice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info Banner */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-300">Registration Process</p>
                    <p className="text-blue-700 dark:text-blue-400">
                      1. Select school and subject → 2. Submit registration (Pending status) → 3. Admin review → 4. Approved/Rejected
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label>Filter by Subject (Optional)</Label>
                <Select value={selectedSubject} onValueChange={(value) => {
                  setSelectedSubject(value as "all" | "chemistry" | "math" | "physics" | "biology" | "english" | "indonesian");
                  setIsLoading(true);
                  // Reset selection saat filter berubah
                  setSelectedSchool(null);
                  setSelectedSubjectForSchool("");
                }}>
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

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Info about quota status */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-green-500 mb-1"></div>
                  <span className="font-medium text-green-700">Available</span>
                  <span className="text-green-600">Many slots</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-amber-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mb-1"></div>
                  <span className="font-medium text-amber-700">Limited</span>
                  <span className="text-amber-600">1-2 slots left</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-red-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-red-500 mb-1"></div>
                  <span className="font-medium text-red-700">Full</span>
                  <span className="text-red-600">No slots</span>
                </div>
              </div>

              {/* Schools Grid */}
              {isLoading ? (
                <div className="text-center py-8 space-y-2">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading available schools...</p>
                </div>
              ) : (
                <>
                  {availableSchools.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2">
                      {availableSchools.map((school) => {
                        const isSelected = selectedSchool?.id === school.id;
                        const hasAvailableSubjects = school.subjects.some(s => s.total_quota - s.registered_count > 0);
                        const meetsGpaRequirement = studentData.gpa >= school.min_gpa;

                        return (
                          <Card
                            key={school.id}
                            className={`transition-all duration-300 ${
                              isSelected ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : ""
                            } ${!hasAvailableSubjects || !meetsGpaRequirement ? "opacity-60" : ""}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <School className="h-5 w-5 text-primary" />
                                  <div>
                                    <h3 className="font-semibold">{school.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{school.location}</span>
                                      {school.status === "inactive" && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          Inactive
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {school.min_gpa > 0 && (
                                  <Badge variant={meetsGpaRequirement ? "success" : "destructive"} className="text-xs">
                                    Min GPA: {school.min_gpa.toFixed(1)}
                                  </Badge>
                                )}
                              </div>

                              {!meetsGpaRequirement && (
                                <p className="text-xs text-destructive mb-3 flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  Your GPA ({studentData.gpa.toFixed(2)}) does not meet the minimum requirement
                                </p>
                              )}

                              {/* Map Display when selected */}
                              {isSelected && school.latitude && school.longitude && (
                                <div className="mb-4 rounded-lg overflow-hidden border animate-fade-in">
                                  <div className="w-full h-48 bg-gradient-to-br from-secondary/30 to-muted/30 flex items-center justify-center">
                                    <div className="text-center">
                                      <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                                      <p className="text-sm font-medium">{school.name}</p>
                                      <p className="text-xs text-muted-foreground">Location: {school.latitude.toFixed(4)}, {school.longitude.toFixed(4)}</p>
                                    </div>
                                  </div>
                                  {school.address && (
                                    <div className="p-2 bg-muted text-xs">
                                      <p className="text-muted-foreground">{school.address}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="space-y-3">
                                <Label className="text-sm font-medium">Available Subjects:</Label>
                                {school.subjects.length > 0 ? (
                                  <div className="space-y-3">
                                    {school.subjects.map((subject) => {
                                      const status = getQuotaStatus(subject);
                                      const available = subject.total_quota - subject.registered_count;
                                      const isAvailable = available > 0;
                                      const isSubjectSelected = isSelected && selectedSubjectForSchool === subject.subject;
                                      const progressBarColor = getProgressBarColor(subject);
                                      const fillPercentage = (subject.registered_count / subject.total_quota) * 100;

                                      return (
                                        <div
                                          key={subject.quotaId}
                                          className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                            isSubjectSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""
                                          } ${!isAvailable || !meetsGpaRequirement || school.status === "inactive" ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}`}
                                          onClick={() => {
                                            if (isAvailable && meetsGpaRequirement && school.status === "active") {
                                              setSelectedSchool(school);
                                              setSelectedSubjectForSchool(subject.subject);
                                            }
                                          }}
                                        >
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              <div className="bg-primary/10 p-2 rounded-lg">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                              </div>
                                              <div>
                                                <p className="font-semibold">
                                                  {subject.subject.charAt(0).toUpperCase() + subject.subject.slice(1)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  Min GPA: {school.min_gpa.toFixed(1)}
                                                </p>
                                              </div>
                                            </div>
                                            
                                            <Badge className={status.badgeColor}>
                                              {status.label}
                                            </Badge>
                                          </div>
                                          
                                          {/* Kuota Information */}
                                          <div className="grid grid-cols-3 gap-3 mb-2">
                                            <div className="text-center p-2 bg-gray-50 rounded">
                                              <div className="text-lg font-bold text-gray-800">{available}</div>
                                              <div className="text-xs text-gray-600">Available</div>
                                            </div>
                                            <div className="text-center p-2 bg-gray-50 rounded">
                                              <div className="text-lg font-bold text-gray-800">{subject.registered_count}</div>
                                              <div className="text-xs text-gray-600">Filled</div>
                                            </div>
                                            <div className="text-center p-2 bg-gray-50 rounded">
                                              <div className="text-lg font-bold text-gray-800">{subject.total_quota}</div>
                                              <div className="text-xs text-gray-600">Total</div>
                                            </div>
                                          </div>
                                          
                                          {/* Progress Bar dengan Persentase */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                              <span className="text-muted-foreground">Capacity Usage</span>
                                              <span className={`font-medium ${
                                                fillPercentage > 80 ? 'text-amber-600' : 
                                                fillPercentage > 50 ? 'text-blue-600' : 
                                                'text-green-600'
                                              }`}>
                                                {fillPercentage.toFixed(0)}% filled
                                              </span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                              <div
                                                className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
                                                style={{ width: `${fillPercentage}%` }}
                                              />
                                            </div>
                                            <div className="flex justify-between text-xs">
                                              <span className="text-green-600 font-medium">
                                                {available} slot{available !== 1 ? 's' : ''} available
                                              </span>
                                              <span className="text-muted-foreground">
                                                {subject.registered_count} filled
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {/* Status Description */}
                                          <div className="mt-2">
                                            <p className="text-xs text-muted-foreground">
                                              {status.description} • {subject.total_quota} total capacity
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-4 text-center border rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                      {selectedSubject === "all" 
                                        ? "No subjects available for this school" 
                                        : `No ${selectedSubject} subjects available for this school`}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Contact administrator to add subjects
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <School className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No schools available for registration.</p>
                      <p className="text-sm mt-1">
                        {searchQuery || selectedSubject !== "all" 
                          ? "Try adjusting your search filters" 
                          : "Please check back later or contact administrator"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Selected School Summary */}
              {selectedSchool && selectedSubjectForSchool && (
                <div className="pt-4 border-t animate-fade-in">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Selected School & Subject</p>
                        <p className="font-bold text-lg">{selectedSchool.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedSchool.location}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        Pending After Submit
                      </Badge>
                    </div>
                    
                    {/* Status Process Explanation */}
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800 dark:text-amber-300">Registration Status Flow</p>
                          <div className="mt-1 text-amber-700 dark:text-amber-400 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <span className="text-xs"><strong>Pending:</strong> After registration</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-xs"><strong>Approved - Active:</strong> After admin approval</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="text-xs"><strong>Rejected:</strong> If admin rejects application</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-center">
                        <div className="text-lg font-bold text-primary">
                          {selectedSubjectForSchool.charAt(0).toUpperCase() + selectedSubjectForSchool.slice(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Subject</div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-center">
                        <div className="text-lg font-bold text-green-600">
                          {(() => {
                            const subject = selectedSchool.subjects.find(s => s.subject === selectedSubjectForSchool);
                            return subject ? subject.total_quota - subject.registered_count : 0;
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">Slots Available</div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-center">
                        <div className="text-lg font-bold text-amber-600">
                          {selectedSchool.min_gpa.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Min GPA Required</div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleRegister} 
                    disabled={isRegistering} 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting Registration...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-5 w-5" />
                        Submit Registration (Pending Status)
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    After submission, your registration will be in <strong>Pending status</strong> until admin approval.
                    Admin will review and change status to <strong>Approved - Active</strong> or <strong>Rejected</strong>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Show only status if already registered
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {studentRegistration.status === 'Approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : studentRegistration.status === 'Pending' ? (
                  <Clock className="h-5 w-5 text-amber-500" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                )}
                {studentRegistration.status === 'Approved' ? 'Registration Active' : 
                 studentRegistration.status === 'Pending' ? 'Registration Pending' : 
                 'Registration Status'}
              </CardTitle>
              <CardDescription>
                {studentRegistration.status === 'Approved' ? 
                  'Your registration has been approved and is now active.' :
                  studentRegistration.status === 'Pending' ?
                  'Your registration is pending admin review and approval.' :
                  'Your registration has been reviewed by admin.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                  studentRegistration.status === 'Approved' ? 'bg-green-100' :
                  studentRegistration.status === 'Pending' ? 'bg-amber-100' :
                  'bg-red-100'
                }`}>
                  {studentRegistration.status === 'Approved' ? (
                    <UserCheck className="h-10 w-10 text-green-600" />
                  ) : studentRegistration.status === 'Pending' ? (
                    <Clock className="h-10 w-10 text-amber-600" />
                  ) : (
                    <ShieldAlert className="h-10 w-10 text-red-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold capitalize">{studentRegistration.status} Status</h3>
                <p className="text-muted-foreground">
                  You are registered for <strong>{registrationInfo?.subject}</strong> at <strong>{registrationInfo?.schoolName}</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Submitted on: {registrationInfo?.registrationDate}
                </p>
                {studentRegistration.status !== 'Pending' && registrationInfo?.reviewDate && (
                  <p className="text-sm text-muted-foreground">
                    Reviewed on: {registrationInfo.reviewDate}
                  </p>
                )}
                
                {/* Status-specific message */}
                {studentRegistration.status === 'Pending' && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-sm text-left">
                        <p className="font-medium text-amber-800 dark:text-amber-300">Waiting for Admin Approval</p>
                        <p className="text-amber-700 dark:text-amber-400">
                          Your registration has been submitted successfully. 
                          An administrator will review your application and update the status to either 
                          <strong> Approved - Active</strong> or <strong>Rejected</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {studentRegistration.status === 'Rejected' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="text-sm text-left">
                        <p className="font-medium text-red-800 dark:text-red-300">Registration Rejected</p>
                        <p className="text-red-700 dark:text-red-400">
                          Your registration has been rejected by the administrator. 
                          Please contact admin for more details about why your application was rejected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Help Section */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Need Assistance?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={openWhatsAppHelp}
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Contact via WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={openPhoneCall}
                      className="gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Call Admin
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    For any issues with your registration status, please contact the admin directly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default SchoolSelection;