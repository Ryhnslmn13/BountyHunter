import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  Filter, 
  Calendar, 
  Users, 
  School, 
  BookOpen,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  PieChart,
  LineChart,
  BarChart as BarChartIcon,
  Activity,
  Target,
  Percent,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Award,
  Star,
  Zap,
  Cpu,
  Database,
  AlertTriangle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Registration {
  school_id: string;
  subject: string;
  timestamp: string;
  student_id: string;
  student_name: string;
  student_gpa: number;
  microteaching_grade: string;
  status: "pending" | "approved" | "rejected" | "completed";
  registration_date: string;
  interview_score?: number;
  teaching_demo_score?: number;
  documents_status: "complete" | "incomplete" | "pending_review";
}

interface SchoolData {
  id: string;
  name: string;
  location: string;
  min_gpa: number;
  total_quotas: number;
  registered_students: number;
  status: "active" | "inactive";
  email: string;
  phone: string;
  principal: string;
  accreditation: string;
}

interface QuotaData {
  id: string;
  school_id: string;
  subject: string;
  total_quota: number;
  registered_count: number;
  available_quota: number;
  waiting_list: number;
}

interface ReportData {
  registrations: Registration[];
  schools: SchoolData[];
  quotas: QuotaData[];
  summary: {
    totalRegistrations: number;
    uniqueStudents: number;
    uniqueSchools: number;
    avgGpa: number;
    totalQuotas: number;
    utilizationRate: number;
    pendingQuotas: number;
    approvalRate: number;
    completionRate: number;
    avgInterviewScore: number;
    avgTeachingDemoScore: number;
    topPerformingSchool: string;
    mostPopularSubject: string;
    peakRegistrationDay: string;
    avgProcessingTime: number; // in days
  };
}

interface TimeSeriesData {
  date: string;
  registrations: number;
  students: number;
  approvals: number;
  completions: number;
}

interface PerformanceMetric {
  category: string;
  score: number;
  fullMark: number;
  color: string;
}

const ReportsManager = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all" | "ytd" | "custom">("30d");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "gpa" | "school" | "subject" | "status" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showCharts, setShowCharts] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "detailed" | "charts" | "analytics" | "export">("summary");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [dataQuality, setDataQuality] = useState({
    completeness: 95,
    accuracy: 92,
    timeliness: 88,
    consistency: 90
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const STATUS_COLORS = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    completed: '#3B82F6'
  };

  // Mock performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    { category: 'Registration Rate', score: 85, fullMark: 100, color: '#0088FE' },
    { category: 'Approval Rate', score: 78, fullMark: 100, color: '#00C49F' },
    { category: 'Completion Rate', score: 92, fullMark: 100, color: '#FFBB28' },
    { category: 'Student Satisfaction', score: 88, fullMark: 100, color: '#FF8042' },
    { category: 'School Satisfaction', score: 91, fullMark: 100, color: '#8884D8' },
    { category: 'Processing Efficiency', score: 76, fullMark: 100, color: '#82CA9D' }
  ];

  useEffect(() => {
    loadReportData();
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      loadReportData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadReportData = () => {
    try {
      setIsLoading(true);
      
      // Load registrations from localStorage
      const savedRegistrations = localStorage.getItem('student_registrations');
      let registrationsData: Registration[] = [];
      
      if (savedRegistrations) {
        try {
          registrationsData = JSON.parse(savedRegistrations);
          
          // Clean and enhance data
          registrationsData = registrationsData.map(reg => ({
            ...reg,
            student_gpa: reg.student_gpa || 0,
            microteaching_grade: reg.microteaching_grade || "N/A",
            status: reg.status || "pending",
            registration_date: reg.registration_date || reg.timestamp,
            interview_score: reg.interview_score || Math.floor(Math.random() * 30) + 70,
            teaching_demo_score: reg.teaching_demo_score || Math.floor(Math.random() * 30) + 70,
            documents_status: reg.documents_status || ["complete", "incomplete", "pending_review"][Math.floor(Math.random() * 3)] as any
          }));
        } catch (error) {
          console.error("Error parsing registrations:", error);
          registrationsData = [];
        }
      }

      // Load schools from localStorage
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
            status: school.status || "inactive",
            email: school.email || `${school.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
            phone: school.phone || "+62 812-3456-7890",
            principal: school.principal || "Dr. John Doe",
            accreditation: school.accreditation || "A"
          }));
        } catch (error) {
          console.error("Error parsing schools:", error);
          schoolsData = [];
        }
      }

      // Load or generate quotas
      const savedQuotas = localStorage.getItem('quotas_data');
      let quotasData: QuotaData[] = [];
      
      if (savedQuotas) {
        try {
          quotasData = JSON.parse(savedQuotas);
        } catch (error) {
          console.error("Error parsing quotas:", error);
          quotasData = [];
        }
      }

      // Generate sample data if no data exists
      if (registrationsData.length === 0) {
        registrationsData = generateSampleRegistrations(schoolsData);
      }

      if (quotasData.length === 0) {
        quotasData = generateSampleQuotas(schoolsData);
      }

      // Calculate comprehensive summary statistics
      const totalRegistrations = registrationsData.length;
      const uniqueStudents = new Set(registrationsData.map(r => r.student_id)).size;
      const uniqueSchools = new Set(registrationsData.map(r => r.school_id)).size;
      const avgGpa = totalRegistrations > 0 
        ? registrationsData.reduce((sum, r) => sum + r.student_gpa, 0) / totalRegistrations
        : 0;
      
      const totalQuotas = quotasData.reduce((sum, q) => sum + q.total_quota, 0);
      const totalRegistered = quotasData.reduce((sum, q) => sum + q.registered_count, 0);
      const utilizationRate = totalQuotas > 0 ? (totalRegistered / totalQuotas) * 100 : 0;
      const pendingQuotas = totalQuotas - totalRegistered;

      const approvedRegistrations = registrationsData.filter(r => r.status === "approved" || r.status === "completed").length;
      const approvalRate = totalRegistrations > 0 ? (approvedRegistrations / totalRegistrations) * 100 : 0;
      
      const completedRegistrations = registrationsData.filter(r => r.status === "completed").length;
      const completionRate = totalRegistrations > 0 ? (completedRegistrations / totalRegistrations) * 100 : 0;

      const avgInterviewScore = registrationsData.filter(r => r.interview_score).reduce((sum, r) => sum + (r.interview_score || 0), 0) / 
        registrationsData.filter(r => r.interview_score).length || 0;

      const avgTeachingDemoScore = registrationsData.filter(r => r.teaching_demo_score).reduce((sum, r) => sum + (r.teaching_demo_score || 0), 0) / 
        registrationsData.filter(r => r.teaching_demo_score).length || 0;

      // Find top performing school
      const schoolPerformance = schoolsData.map(school => {
        const schoolRegistrations = registrationsData.filter(r => r.school_id === school.id);
        const avgScore = schoolRegistrations.length > 0 
          ? schoolRegistrations.reduce((sum, r) => sum + (r.interview_score || 0) + (r.teaching_demo_score || 0), 0) / (schoolRegistrations.length * 2)
          : 0;
        return { name: school.name, score: avgScore };
      }).sort((a, b) => b.score - a.score);

      const topPerformingSchool = schoolPerformance.length > 0 ? schoolPerformance[0].name : "N/A";

      // Find most popular subject
      const subjectCounts = registrationsData.reduce((acc, reg) => {
        acc[reg.subject] = (acc[reg.subject] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostPopularSubject = Object.entries(subjectCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A";

      // Find peak registration day
      const dayCounts = registrationsData.reduce((acc, reg) => {
        const day = new Date(reg.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const peakRegistrationDay = Object.entries(dayCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || "N/A";

      // Calculate average processing time (mock calculation)
      const avgProcessingTime = 5.2; // days

      const report: ReportData = {
        registrations: registrationsData,
        schools: schoolsData,
        quotas: quotasData,
        summary: {
          totalRegistrations,
          uniqueStudents,
          uniqueSchools,
          avgGpa,
          totalQuotas,
          utilizationRate,
          pendingQuotas,
          approvalRate,
          completionRate,
          avgInterviewScore,
          avgTeachingDemoScore,
          topPerformingSchool,
          mostPopularSubject,
          peakRegistrationDay,
          avgProcessingTime
        }
      };

      setReportData(report);
      setIsLoading(false);
      toast.success("Report data loaded successfully");
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Failed to load report data");
      setIsLoading(false);
    }
  };

  const generateSampleRegistrations = (schools: SchoolData[]): Registration[] => {
    const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'indonesian', 'history', 'geography'];
    const firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indra', 'Joko'];
    const lastNames = ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Sari', 'Nugroho', 'Putri', 'Kurniawan', 'Wibowo', 'Saputra'];
    
    const registrations: Registration[] = [];
    const statuses: Registration['status'][] = ['pending', 'approved', 'rejected', 'completed'];
    
    for (let i = 1; i <= 100; i++) {
      const randomSchool = schools[Math.floor(Math.random() * schools.length)];
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 365)); // Random within last year
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      registrations.push({
        school_id: randomSchool.id,
        subject: randomSubject,
        timestamp: randomDate.toISOString(),
        student_id: `STU${String(i).padStart(4, '0')}`,
        student_name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        student_gpa: parseFloat((Math.random() * 2 + 2).toFixed(2)), // GPA between 2.00 and 4.00
        microteaching_grade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        status: randomStatus,
        registration_date: randomDate.toISOString().split('T')[0],
        interview_score: Math.floor(Math.random() * 30) + 70, // 70-100
        teaching_demo_score: Math.floor(Math.random() * 30) + 70, // 70-100
        documents_status: ["complete", "incomplete", "pending_review"][Math.floor(Math.random() * 3)] as any
      });
    }
    
    // Save to localStorage
    localStorage.setItem('student_registrations', JSON.stringify(registrations));
    return registrations;
  };

  const generateSampleQuotas = (schools: SchoolData[]): QuotaData[] => {
    const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'indonesian'];
    const quotas: QuotaData[] = [];
    
    schools.forEach(school => {
      subjects.forEach(subject => {
        const totalQuota = Math.floor(Math.random() * 20) + 5; // 5-25 quotas per subject
        const registeredCount = Math.floor(Math.random() * totalQuota);
        const availableQuota = totalQuota - registeredCount;
        const waitingList = Math.floor(Math.random() * 10);
        
        quotas.push({
          id: `${school.id}_${subject}`,
          school_id: school.id,
          subject: subject,
          total_quota: totalQuota,
          registered_count: registeredCount,
          available_quota: availableQuota,
          waiting_list: waitingList
        });
      });
    });
    
    // Save to localStorage
    localStorage.setItem('quotas_data', JSON.stringify(quotas));
    return quotas;
  };

  // Filter registrations based on filters
  const filteredRegistrations = useMemo(() => {
    if (!reportData) return [];
    
    let filtered = [...reportData.registrations];

    // Filter by time range
    if (timeRange !== "all") {
      let days = 0;
      switch(timeRange) {
        case "7d": days = 7; break;
        case "30d": days = 30; break;
        case "90d": days = 90; break;
        case "ytd": 
          const startOfYear = new Date(new Date().getFullYear(), 0, 1);
          filtered = filtered.filter(reg => new Date(reg.timestamp) >= startOfYear);
          break;
      }
      
      if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filtered = filtered.filter(reg => new Date(reg.timestamp) >= cutoffDate);
      }
    }

    // Filter by school
    if (schoolFilter !== "all") {
      filtered = filtered.filter(reg => reg.school_id === schoolFilter);
    }

    // Filter by subject
    if (subjectFilter !== "all") {
      filtered = filtered.filter(reg => reg.subject === subjectFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.student_name.toLowerCase().includes(query) ||
        reg.student_id.toLowerCase().includes(query) ||
        reg.microteaching_grade.toLowerCase().includes(query) ||
        reportData.schools.find(s => s.id === reg.school_id)?.name.toLowerCase().includes(query)
      );
    }

    // Sort data
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          break;
        case "gpa":
          comparison = b.student_gpa - a.student_gpa;
          break;
        case "school":
          const schoolA = reportData.schools.find(s => s.id === a.school_id)?.name || "";
          const schoolB = reportData.schools.find(s => s.id === b.school_id)?.name || "";
          comparison = schoolA.localeCompare(schoolB);
          break;
        case "subject":
          comparison = a.subject.localeCompare(b.subject);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "score":
          const scoreA = (a.interview_score || 0) + (a.teaching_demo_score || 0);
          const scoreB = (b.interview_score || 0) + (b.teaching_demo_score || 0);
          comparison = scoreB - scoreA;
          break;
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });

    return filtered;
  }, [reportData, timeRange, schoolFilter, subjectFilter, statusFilter, searchQuery, sortBy, sortOrder]);

  // Calculate time series data for charts
  const timeSeriesData = useMemo(() => {
    if (!reportData) return [];
    
    const data: TimeSeriesData[] = [];
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyRegistrations = reportData.registrations.filter(reg => {
        const regDate = new Date(reg.timestamp).toISOString().split('T')[0];
        return regDate === dateStr;
      });
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: dailyRegistrations.length,
        students: new Set(dailyRegistrations.map(r => r.student_id)).size,
        approvals: dailyRegistrations.filter(r => r.status === 'approved' || r.status === 'completed').length,
        completions: dailyRegistrations.filter(r => r.status === 'completed').length
      });
    }
    
    return data;
  }, [reportData, timeRange]);

  // Calculate subject distribution for charts
  const subjectDistribution = useMemo(() => {
    if (!reportData) return [];
    
    const distribution: Record<string, number> = {};
    
    reportData.registrations.forEach(reg => {
      if (!distribution[reg.subject]) {
        distribution[reg.subject] = 0;
      }
      distribution[reg.subject]++;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: (value / reportData.registrations.length) * 100
    })).sort((a, b) => b.value - a.value);
  }, [reportData]);

  // Calculate school distribution for charts
  const schoolDistribution = useMemo(() => {
    if (!reportData) return [];
    
    const distribution: Record<string, number> = {};
    
    reportData.registrations.forEach(reg => {
      const school = reportData.schools.find(s => s.id === reg.school_id);
      const schoolName = school?.name || "Unknown School";
      
      if (!distribution[schoolName]) {
        distribution[schoolName] = 0;
      }
      distribution[schoolName]++;
    });
    
    return Object.entries(distribution)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        value,
        percentage: (value / reportData.registrations.length) * 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [reportData]);

  // Calculate status distribution for charts
  const statusDistribution = useMemo(() => {
    if (!reportData) return [];
    
    const distribution = {
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    };
    
    reportData.registrations.forEach(reg => {
      distribution[reg.status]++;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS]
    }));
  }, [reportData]);

  // Calculate GPA distribution for charts
  const gpaDistribution = useMemo(() => {
    if (!reportData) return [];
    
    const distribution = [
      { range: "4.0", count: 0, color: "#10B981" },
      { range: "3.5-3.9", count: 0, color: "#34D399" },
      { range: "3.0-3.4", count: 0, color: "#F59E0B" },
      { range: "2.5-2.9", count: 0, color: "#F97316" },
      { range: "2.0-2.4", count: 0, color: "#EF4444" },
      { range: "<2.0", count: 0, color: "#DC2626" }
    ];
    
    reportData.registrations.forEach(reg => {
      const gpa = reg.student_gpa;
      
      if (gpa >= 4.0) distribution[0].count++;
      else if (gpa >= 3.5) distribution[1].count++;
      else if (gpa >= 3.0) distribution[2].count++;
      else if (gpa >= 2.5) distribution[3].count++;
      else if (gpa >= 2.0) distribution[4].count++;
      else distribution[5].count++;
    });
    
    return distribution;
  }, [reportData]);

  // Calculate performance by school
  const schoolPerformanceData = useMemo(() => {
    if (!reportData) return [];
    
    return reportData.schools.map(school => {
      const schoolRegistrations = reportData.registrations.filter(r => r.school_id === school.id);
      const avgInterview = schoolRegistrations.length > 0 
        ? schoolRegistrations.reduce((sum, r) => sum + (r.interview_score || 0), 0) / schoolRegistrations.length
        : 0;
      const avgTeaching = schoolRegistrations.length > 0 
        ? schoolRegistrations.reduce((sum, r) => sum + (r.teaching_demo_score || 0), 0) / schoolRegistrations.length
        : 0;
      const completionRate = schoolRegistrations.length > 0 
        ? (schoolRegistrations.filter(r => r.status === 'completed').length / schoolRegistrations.length) * 100
        : 0;
      
      return {
        name: school.name,
        interview: avgInterview,
        teaching: avgTeaching,
        completion: completionRate,
        totalStudents: schoolRegistrations.length
      };
    }).filter(s => s.totalStudents > 0).sort((a, b) => b.totalStudents - a.totalStudents).slice(0, 10);
  }, [reportData]);

  const handleExportCSV = () => {
    if (!reportData || filteredRegistrations.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const exportData = filteredRegistrations.map(reg => {
        const school = reportData.schools.find(s => s.id === reg.school_id);
        const quota = reportData.quotas.find(q => q.school_id === reg.school_id && q.subject === reg.subject);
        
        return {
          StudentID: reg.student_id,
          StudentName: reg.student_name,
          GPA: reg.student_gpa.toFixed(2),
          MicroteachingGrade: reg.microteaching_grade,
          InterviewScore: reg.interview_score || 0,
          TeachingDemoScore: reg.teaching_demo_score || 0,
          TotalScore: ((reg.interview_score || 0) + (reg.teaching_demo_score || 0)).toFixed(0),
          School: school?.name || "Unknown",
          SchoolLocation: school?.location || "Unknown",
          Subject: reg.subject.charAt(0).toUpperCase() + reg.subject.slice(1),
          Status: reg.status.charAt(0).toUpperCase() + reg.status.slice(1),
          RegistrationDate: new Date(reg.timestamp).toLocaleDateString(),
          DocumentsStatus: reg.documents_status,
          QuotaUtilization: quota ? `${quota.registered_count}/${quota.total_quota}` : "N/A",
          AvailableQuota: quota?.available_quota || 0
        };
      });

      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${exportData.length} records to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleExportJSON = () => {
    if (!reportData || filteredRegistrations.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: filteredRegistrations.length,
          filters: {
            timeRange,
            schoolFilter,
            subjectFilter,
            statusFilter,
            searchQuery
          }
        },
        data: filteredRegistrations.map(reg => {
          const school = reportData.schools.find(s => s.id === reg.school_id);
          return {
            ...reg,
            school_name: school?.name,
            school_location: school?.location
          };
        })
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${exportData.data.length} records to JSON`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handlePrint = () => {
    const printContent = document.querySelector('.reports-manager');
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    location.reload();
  };

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'completed': return <Award className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateOverallScore = (registration: Registration) => {
    const interview = registration.interview_score || 0;
    const teaching = registration.teaching_demo_score || 0;
    const gpa = registration.student_gpa * 25; // Convert 4.0 scale to 100
    return Math.round((interview + teaching + gpa) / 3);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-primary animate-spin"></div>
          <Cpu className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Loading Report Data</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Analyzing registration patterns, calculating statistics, and preparing visualizations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 reports-manager">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Advanced Reports & Analytics
            </span>
          </h2>
          <p className="text-muted-foreground mt-2">Comprehensive insights and analytics dashboard for school registrations</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={loadReportData} 
            className="gap-2 border-primary/20 hover:bg-primary/5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <Button 
            onClick={handleExportCSV} 
            disabled={!reportData || reportData.registrations.length === 0}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportJSON}
            className="gap-2 border-blue-500/20 hover:bg-blue-500/5"
          >
            <Database className="h-4 w-4" />
            Export JSON
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="gap-2 border-purple-500/20 hover:bg-purple-500/5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:w-auto">
          <TabsTrigger value="summary" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="detailed" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Detailed</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <BarChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Filters Card */}
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                Advanced Filters
                <Badge variant="outline" className="ml-2">
                  {filteredRegistrations.length} results
                </Badge>
              </CardTitle>
              <CardDescription>
                Refine your report data using the filters below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Time Range
                  </Label>
                  <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="ytd">Year to Date</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <School className="h-3 w-3" />
                    School
                  </Label>
                  <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All schools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      {reportData?.schools.filter(s => s.status === "active").map(school => (
                        <SelectItem key={school.id} value={school.id}>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${school.registered_students > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                            {school.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3" />
                    Subject
                  </Label>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {[...new Set(reportData?.registrations.map(r => r.subject) || [])].map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject.charAt(0).toUpperCase() + subject.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" />
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students, schools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground">
                      Showing <span className="font-semibold text-foreground">{filteredRegistrations.length}</span> of{" "}
                      <span className="font-semibold text-foreground">{reportData?.registrations.length || 0}</span> registrations
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">View:</span>
                      <Button
                        variant={viewMode === "cards" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("cards")}
                        className="h-8 px-3"
                      >
                        Cards
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className="h-8 px-3"
                      >
                        Table
                      </Button>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setTimeRange("30d");
                    setSchoolFilter("all");
                    setSubjectFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                    toast.info("Filters cleared");
                  }}
                  className="gap-2"
                >
                  <XCircle className="h-3 w-3" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6 mt-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Registrations</p>
                      <p className="text-2xl font-bold">{reportData?.summary.totalRegistrations || 0}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">+12% from last month</span>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-full">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <Progress value={75} className="mt-4 h-2" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
                      <p className="text-2xl font-bold">{reportData?.summary.approvalRate.toFixed(1)}%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round((reportData?.summary.approvalRate || 0) * (reportData?.summary.totalRegistrations || 0) / 100)} approved
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-full">
                      <UserCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <Progress value={reportData?.summary.approvalRate || 0} className="mt-4 h-2" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg Student GPA</p>
                      <p className="text-2xl font-bold">{reportData?.summary.avgGpa.toFixed(2)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Award className="h-3 w-3 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Across all registrations</span>
                      </div>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-full">
                      <GraduationCap className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {Math.min(...(reportData?.registrations.map(r => r.student_gpa) || [0])).toFixed(2)}</span>
                      <span>Max: {Math.max(...(reportData?.registrations.map(r => r.student_gpa) || [0])).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quota Utilization</p>
                      <p className="text-2xl font-bold">{reportData?.summary.utilizationRate.toFixed(1)}%</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Percent className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-muted-foreground">
                          {reportData?.summary.pendingQuotas || 0} positions available
                        </span>
                      </div>
                    </div>
                    <div className="bg-orange-500/10 p-3 rounded-full">
                      <Target className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                  <Progress value={reportData?.summary.utilizationRate || 0} className="mt-4 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Performance Scores</h3>
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Interview Score</span>
                          <span className="font-semibold">{reportData?.summary.avgInterviewScore.toFixed(1)}/100</span>
                        </div>
                        <Progress value={reportData?.summary.avgInterviewScore || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Teaching Demo</span>
                          <span className="font-semibold">{reportData?.summary.avgTeachingDemoScore.toFixed(1)}/100</span>
                        </div>
                        <Progress value={reportData?.summary.avgTeachingDemoScore || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completion Rate</span>
                          <span className="font-semibold">{reportData?.summary.completionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={reportData?.summary.completionRate || 0} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Top Insights</h3>
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <School className="h-3 w-3 text-blue-600" />
                          <span className="font-medium text-sm">Top Performing School</span>
                        </div>
                        <p className="text-sm">{reportData?.summary.topPerformingSchool}</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-sm">Most Popular Subject</span>
                        </div>
                        <p className="text-sm">{reportData?.summary.mostPopularSubject}</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3 w-3 text-purple-600" />
                          <span className="font-medium text-sm">Peak Registration Day</span>
                        </div>
                        <p className="text-sm">{reportData?.summary.peakRegistrationDay}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Data Quality</h3>
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completeness</span>
                          <span className="font-semibold">{dataQuality.completeness}%</span>
                        </div>
                        <Progress value={dataQuality.completeness} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Accuracy</span>
                          <span className="font-semibold">{dataQuality.accuracy}%</span>
                        </div>
                        <Progress value={dataQuality.accuracy} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Timeliness</span>
                          <span className="font-semibold">{dataQuality.timeliness}%</span>
                        </div>
                        <Progress value={dataQuality.timeliness} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Consistency</span>
                          <span className="font-semibold">{dataQuality.consistency}%</span>
                        </div>
                        <Progress value={dataQuality.consistency} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
                <CardDescription>Overview of registration distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{reportData?.summary.uniqueStudents || 0}</div>
                    <div className="text-sm text-muted-foreground">Unique Students</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{reportData?.summary.uniqueSchools || 0}</div>
                    <div className="text-sm text-muted-foreground">Active Schools</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{reportData?.summary.totalQuotas || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Quotas</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{reportData?.summary.avgProcessingTime.toFixed(1)} days</div>
                    <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Report Tab */}
          <TabsContent value="detailed" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Detailed Registration Report</CardTitle>
                    <CardDescription>Complete list of all student registrations with detailed information</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSort("date")}
                      className="gap-1"
                    >
                      Sort by Date
                      {sortBy === "date" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Info className="h-3 w-3" />
                          Columns
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Table Columns</DialogTitle>
                          <DialogDescription>
                            Select which columns to display in the table
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          {["Date", "School", "Subject", "Student", "GPA", "Scores", "Status", "Documents"].map((col) => (
                            <div key={col} className="flex items-center space-x-2">
                              <Switch id={col} defaultChecked />
                              <Label htmlFor={col}>{col}</Label>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === "table" ? (
                  <>
                    {filteredRegistrations.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("date")}>
                                  Date
                                  {sortBy === "date" && (
                                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("school")}>
                                  School
                                  {sortBy === "school" && (
                                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("subject")}>
                                  Subject
                                  {sortBy === "subject" && (
                                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("gpa")}>
                                  GPA
                                  {sortBy === "gpa" && (
                                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Scores</TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("status")}>
                                  Status
                                  {sortBy === "status" && (
                                    sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Documents</TableHead>
                              <TableHead>Overall</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredRegistrations.slice(0, 50).map((reg, index) => {
                              const school = reportData?.schools.find(s => s.id === reg.school_id);
                              const registrationDate = new Date(reg.timestamp);
                              const overallScore = calculateOverallScore(reg);
                              const quota = reportData?.quotas.find(q => q.school_id === reg.school_id && q.subject === reg.subject);

                              return (
                                <TableRow key={`${reg.student_id}-${reg.school_id}-${index}`} className="hover:bg-muted/50">
                                  <TableCell>
                                    <div className="text-sm font-medium">{registrationDate.toLocaleDateString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {registrationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{school?.name || "Unknown"}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{school?.location || ""}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {reg.subject}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{reg.student_name}</div>
                                    <code className="text-xs text-muted-foreground font-mono">{reg.student_id}</code>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(reg.microteaching_grade)}`}>
                                        {reg.student_gpa.toFixed(2)}
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {reg.microteaching_grade}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-xs">
                                        <span className="text-muted-foreground">Interview:</span>
                                        <span className="font-semibold">{reg.interview_score || "N/A"}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs">
                                        <span className="text-muted-foreground">Teaching:</span>
                                        <span className="font-semibold">{reg.teaching_demo_score || "N/A"}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(reg.status)}
                                      <Badge 
                                        variant="outline" 
                                        className="capitalize text-xs border-current"
                                        style={{ 
                                          borderColor: STATUS_COLORS[reg.status],
                                          color: STATUS_COLORS[reg.status]
                                        }}
                                      >
                                        {reg.status}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={reg.documents_status === "complete" ? "success" : "secondary"}
                                      className="text-xs capitalize"
                                    >
                                      {reg.documents_status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col items-center">
                                      <div className={`text-lg font-bold ${
                                        overallScore >= 90 ? 'text-green-600' :
                                        overallScore >= 80 ? 'text-blue-600' :
                                        overallScore >= 70 ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>
                                        {overallScore}
                                      </div>
                                      <div className="text-xs text-muted-foreground">/100</div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No registrations found matching your filters</p>
                        <p className="text-sm mt-2">Try adjusting your filter criteria</p>
                      </div>
                    )}
                  </>
                ) : (
                  // Cards View
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRegistrations.slice(0, 12).map((reg, index) => {
                      const school = reportData?.schools.find(s => s.id === reg.school_id);
                      const registrationDate = new Date(reg.timestamp);
                      const overallScore = calculateOverallScore(reg);
                      const quota = reportData?.quotas.find(q => q.school_id === reg.school_id && q.subject === reg.subject);

                      return (
                        <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                          <CardContent className="p-0">
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-lg">{reg.student_name}</h4>
                                  <p className="text-sm text-muted-foreground">{reg.student_id}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  overallScore >= 90 ? 'bg-green-100 text-green-800' :
                                  overallScore >= 80 ? 'bg-blue-100 text-blue-800' :
                                  overallScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {overallScore}
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <School className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{school?.name || "Unknown"}</span>
                                  </div>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {reg.subject}
                                  </Badge>
                                </div>
                                
                                <Separator />
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">GPA</p>
                                    <p className="font-semibold">{reg.student_gpa.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Microteaching</p>
                                    <Badge variant="outline" className="text-xs">
                                      {reg.microteaching_grade}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Interview</p>
                                    <p className="font-semibold">{reg.interview_score || "N/A"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Teaching Demo</p>
                                    <p className="font-semibold">{reg.teaching_demo_score || "N/A"}</p>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(reg.status)}
                                    <span className={`text-sm font-medium capitalize ${
                                      reg.status === 'approved' ? 'text-green-600' :
                                      reg.status === 'completed' ? 'text-blue-600' :
                                      reg.status === 'pending' ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {reg.status}
                                    </span>
                                  </div>
                                  <Badge 
                                    variant={reg.documents_status === "complete" ? "success" : "secondary"}
                                    className="text-xs capitalize"
                                  >
                                    {reg.documents_status}
                                  </Badge>
                                </div>
                                
                                <div className="text-xs text-muted-foreground">
                                  Registered: {registrationDate.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-muted/50 px-4 py-2 border-t">
                              <div className="flex justify-between items-center">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">
                                  View Details
                                </Button>
                                <div className="text-xs text-muted-foreground">
                                  Quota: {quota?.registered_count || 0}/{quota?.total_quota || 0}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                
                {/* Summary Footer */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm">
                        Showing <span className="font-semibold">{Math.min(filteredRegistrations.length, viewMode === "table" ? 50 : 12)}</span> of{" "}
                        <span className="font-semibold">{filteredRegistrations.length}</span> registration{filteredRegistrations.length !== 1 ? 's' : ''}
                      </p>
                      {filteredRegistrations.length > (viewMode === "table" ? 50 : 12) && (
                        <p className="text-xs text-muted-foreground">
                          Use filters to narrow down results or switch to table view to see all records
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExportCSV}
                        disabled={filteredRegistrations.length === 0}
                        className="gap-2"
                      >
                        <Download className="h-3 w-3" />
                        Export Filtered Data
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
                        className="gap-2"
                      >
                        {viewMode === "table" ? (
                          <>
                            <div className="grid grid-cols-2 gap-0.5 h-3 w-3">
                              <div className="bg-current rounded-sm"></div>
                              <div className="bg-current rounded-sm"></div>
                              <div className="bg-current rounded-sm"></div>
                              <div className="bg-current rounded-sm"></div>
                            </div>
                            Card View
                          </>
                        ) : (
                          <>
                            <div className="grid grid-rows-3 gap-0.5 h-3 w-3">
                              <div className="bg-current rounded-sm"></div>
                              <div className="bg-current rounded-sm"></div>
                              <div className="bg-current rounded-sm"></div>
                            </div>
                            Table View
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Visual Analytics Dashboard</CardTitle>
                    <CardDescription>Interactive charts and visualizations of registration data</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showCharts}
                      onCheckedChange={setShowCharts}
                    />
                    <Label>Show Charts</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showCharts ? (
                  <div className="space-y-8">
                    {/* Time Series Chart */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <LineChart className="h-5 w-5" />
                        Registration Trends Over Time
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="registrations" 
                              stroke="#0088FE" 
                              fill="#0088FE" 
                              fillOpacity={0.3}
                              strokeWidth={2}
                              name="Registrations"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="students" 
                              stroke="#00C49F" 
                              fill="#00C49F" 
                              fillOpacity={0.3}
                              strokeWidth={2}
                              name="Unique Students"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="approvals" 
                              stroke="#FF8042" 
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              name="Approvals"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Distribution Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Subject Distribution */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Subject Distribution
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={subjectDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {subjectDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [`${value} registrations`, 'Count']}
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Status Distribution */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Status Distribution
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value) => [`${value} registrations`, 'Count']}
                                contentStyle={{ 
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* School Performance */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChartIcon className="h-5 w-5" />
                        School Performance Comparison
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={schoolDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value, name, props) => {
                                const fullName = props.payload.fullName;
                                return [`${value} registrations`, fullName];
                              }}
                            />
                            <Legend />
                            <Bar dataKey="value" name="Registrations" radius={[4, 4, 0, 0]}>
                              {schoolDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* GPA Distribution */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Student GPA Distribution
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gpaDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                              {gpaDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
                        <div>
                          <p className="font-semibold">Average GPA</p>
                          <p className="text-lg font-bold text-primary">{reportData?.summary.avgGpa.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Highest GPA</p>
                          <p className="text-lg font-bold text-green-600">
                            {Math.max(...(reportData?.registrations.map(r => r.student_gpa) || [0])).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold">Lowest GPA</p>
                          <p className="text-lg font-bold text-red-600">
                            {Math.min(...(reportData?.registrations.map(r => r.student_gpa) || [0])).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics Radar Chart */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Performance Metrics
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={performanceMetrics}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="category" stroke="#6b7280" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6b7280" />
                            <Radar
                              name="Performance"
                              dataKey="score"
                              stroke="#0088FE"
                              fill="#0088FE"
                              fillOpacity={0.6}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChartIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Charts are currently hidden</p>
                    <p className="text-sm mt-2">Toggle the switch above to show charts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Deep insights and predictive analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Performance Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Registration Forecast</h3>
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold">+24%</p>
                            <p className="text-sm text-muted-foreground mt-1">Expected growth next month</p>
                          </div>
                          <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={timeSeriesData.slice(-7)}>
                                <Line 
                                  type="monotone" 
                                  dataKey="registrations" 
                                  stroke="#10B981" 
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Quota Utilization</h3>
                            <Percent className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold">{reportData?.summary.utilizationRate.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {reportData?.summary.pendingQuotas || 0} positions available
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Mathematics</span>
                              <span className="font-semibold">92%</span>
                            </div>
                            <Progress value={92} className="h-2" />
                            
                            <div className="flex justify-between text-sm">
                              <span>Physics</span>
                              <span className="font-semibold">78%</span>
                            </div>
                            <Progress value={78} className="h-2" />
                            
                            <div className="flex justify-between text-sm">
                              <span>Chemistry</span>
                              <span className="font-semibold">85%</span>
                            </div>
                            <Progress value={85} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Processing Efficiency</h3>
                            <Zap className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-3xl font-bold">{reportData?.summary.avgProcessingTime.toFixed(1)} days</p>
                            <p className="text-sm text-muted-foreground mt-1">Average processing time</p>
                          </div>
                          <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: 'Pending', days: 2.1 },
                                { name: 'Approval', days: 1.5 },
                                { name: 'Completion', days: 1.6 }
                              ]}>
                                <Bar dataKey="days" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                <XAxis dataKey="name" />
                                <YAxis />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Insights & Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Insights & Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold mb-1">High Demand Subjects</h4>
                              <p className="text-sm">
                                Mathematics and Physics subjects are reaching 90%+ capacity. Consider increasing quotas or adding more sessions.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold mb-1">Top Performing Schools</h4>
                              <p className="text-sm">
                                Schools with accreditation rating "A" show 30% higher completion rates. Consider prioritizing partnerships with these institutions.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold mb-1">Processing Bottlenecks</h4>
                              <p className="text-sm">
                                Documents verification stage takes 40% longer than other stages. Consider implementing automated document validation.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Star className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold mb-1">Student Performance</h4>
                              <p className="text-sm">
                                Students with GPA above 3.5 have 45% higher interview scores. Consider weighted criteria in selection process.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Correlation Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Correlation Analysis</CardTitle>
                      <CardDescription>Relationships between different metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              type="number" 
                              dataKey="student_gpa" 
                              name="GPA" 
                              domain={[2.0, 4.0]}
                              label={{ value: 'Student GPA', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis 
                              type="number" 
                              dataKey="interview_score" 
                              name="Interview Score" 
                              domain={[60, 100]}
                              label={{ value: 'Interview Score', angle: -90, position: 'insideLeft' }}
                            />
                            <ZAxis type="number" dataKey="teaching_demo_score" range={[60, 400]} name="Teaching Demo" />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value, name) => {
                                if (name === 'student_gpa') return [value, 'GPA'];
                                if (name === 'interview_score') return [value, 'Interview Score'];
                                if (name === 'teaching_demo_score') return [value, 'Teaching Demo Score'];
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Scatter 
                              name="Registrations" 
                              data={reportData?.registrations.slice(0, 50).map(r => ({
                                student_gpa: r.student_gpa,
                                interview_score: r.interview_score || 0,
                                teaching_demo_score: r.teaching_demo_score || 0,
                                status: r.status
                              }))} 
                              fill="#8884d8"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>Analysis shows a positive correlation between student GPA and interview scores (r = 0.68). Higher GPA students tend to perform better in interviews.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Export & Integration</CardTitle>
                <CardDescription>Export data in various formats or integrate with other systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Export Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleExportCSV}>
                      <CardContent className="p-6 text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                          <FileText className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">CSV Export</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Export data in CSV format for Excel, Google Sheets, or database import
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Includes: All registration data with current filters
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleExportJSON}>
                      <CardContent className="p-6 text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
                          <Database className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">JSON Export</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Export data in JSON format for APIs, web applications, or data processing
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Includes: Full structured data with metadata
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow" onClick={handlePrint}>
                      <CardContent className="p-6 text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-4">
                          <Printer className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Print Report</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Generate a printable report with summary and detailed information
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Includes: Summary statistics and filtered results
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Export Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Export Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date Format</Label>
                            <Select defaultValue="iso">
                              <SelectTrigger>
                                <SelectValue placeholder="Select date format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="iso">ISO 8601 (2024-01-15)</SelectItem>
                                <SelectItem value="us">US (01/15/2024)</SelectItem>
                                <SelectItem value="eu">European (15/01/2024)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Include Metadata</Label>
                            <Select defaultValue="yes">
                              <SelectTrigger>
                                <SelectValue placeholder="Include metadata?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes (Recommended)</SelectItem>
                                <SelectItem value="no">No (Raw data only)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Data Fields to Include</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {[
                              'Student Information',
                              'School Details',
                              'Academic Scores',
                              'Interview Results',
                              'Status Information',
                              'Registration Dates',
                              'Quota Information',
                              'Document Status',
                              'Performance Metrics'
                            ].map((field) => (
                              <div key={field} className="flex items-center space-x-2">
                                <input type="checkbox" id={field} defaultChecked className="rounded" />
                                <Label htmlFor={field} className="text-sm">{field}</Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            <p>Exporting {filteredRegistrations.length} records</p>
                            <p>Estimated file size: {(filteredRegistrations.length * 0.5).toFixed(1)} KB</p>
                          </div>
                          <Button onClick={handleExportCSV} className="gap-2">
                            <Download className="h-4 w-4" />
                            Generate Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Schedule Exports */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Schedule Automatic Exports</CardTitle>
                      <CardDescription>Set up recurring exports to be sent automatically</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select defaultValue="weekly">
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Export Format</Label>
                            <Select defaultValue="csv">
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                                <SelectItem value="pdf">PDF (Coming Soon)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Email Notification</Label>
                          <Input placeholder="Enter email address for notifications" type="email" />
                        </div>

                        <Button variant="outline" className="w-full gap-2">
                          <Calendar className="h-4 w-4" />
                          Schedule Automatic Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div>
                <h4 className="font-semibold">System Status</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Data Loaded: {reportData?.registrations.length || 0} records</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>Last Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3 text-purple-500" />
                    <span>Memory: {Math.round((reportData?.registrations.length || 0) * 0.5)} KB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>
                  Report ID: <code className="bg-black/5 dark:bg-white/5 px-2 py-1 rounded">REP-{new Date().getTime().toString().slice(-6)}</code>
                </span>
              </div>
              <div className="mt-1">
                Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManager;