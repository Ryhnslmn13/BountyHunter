import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School, Search, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

const subjects = [
  { value: "chemistry", label: "Chemistry" },
  { value: "math", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English" },
  { value: "indonesian", label: "Indonesian" },
];

const SchoolSelection = ({ studentData, onComplete, onBack }: SchoolSelectionProps) => {
  const [quotas, setQuotas] = useState<SchoolQuota[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<GroupedSchool | null>(null);
  const [selectedSubjectForSchool, setSelectedSubjectForSchool] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<"all" | "chemistry" | "math" | "physics" | "biology" | "english" | "indonesian">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    fetchQuotas();
  }, [selectedSubject]);

  const fetchQuotas = async () => {
    let query = supabase
      .from("school_quotas")
      .select("*, schools(*)")
      .gt("total_quota", 0);

    if (selectedSubject !== "all") {
      query = query.eq("subject", selectedSubject as "chemistry" | "math" | "physics" | "biology" | "english" | "indonesian");
    }

    const { data, error } = await query.order("schools(name)");

    if (error) {
      toast.error("Failed to load schools");
      return;
    }

    setQuotas((data as any) || []);
    setIsLoading(false);
  };

  // Group quotas by school
  const groupedSchools = quotas.reduce((acc, quota) => {
    const schoolId = quota.school_id;
    if (!acc[schoolId]) {
      acc[schoolId] = {
        id: quota.schools.id,
        name: quota.schools.name,
        location: quota.schools.location,
        min_gpa: (quota.schools as any).min_gpa || 0,
        latitude: (quota.schools as any).latitude || null,
        longitude: (quota.schools as any).longitude || null,
        address: (quota.schools as any).address || null,
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

  const schools = Object.values(groupedSchools).filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegister = async () => {
    if (!selectedSchool || !selectedSubjectForSchool) return;

    setIsRegistering(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to register");
        setIsRegistering(false);
        return;
      }

      // Get or create student record
      let { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (studentError && studentError.code !== "PGRST116") {
        throw studentError;
      }

      if (!student) {
        const { data: newStudent, error: insertError } = await supabase
          .from("students")
          .insert([{
            user_id: user.id,
            student_id: studentData.id,
            name: studentData.name,
            has_microteaching: studentData.hasMicroteaching,
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        student = newStudent;
      }

      // Register for the selected school and subject
      const { error: registrationError } = await supabase
        .from("registrations")
        .insert([{
          student_id: student.id,
          school_id: selectedSchool.id,
          subject: selectedSubjectForSchool as "biology" | "chemistry" | "english" | "indonesian" | "math" | "physics",
        }]);

      if (registrationError) {
        if (registrationError.code === "23505") {
          toast.error("You have already registered for a school");
        } else {
          throw registrationError;
        }
        setIsRegistering(false);
        return;
      }

      setIsRegistering(false);
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        onComplete();
      }, 3000);
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "Please try again later",
      });
      setIsRegistering(false);
    }
  };

  const getQuotaStatus = (subject: { total_quota: number; registered_count: number }) => {
    const available = subject.total_quota - subject.registered_count;
    const percentage = (available / subject.total_quota) * 100;
    
    if (available === 0) return { color: "destructive", label: "Full" };
    if (percentage < 30) return { color: "warning", label: "Limited" };
    return { color: "success", label: "Available" };
  };

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-4 animate-scale-in">
            <div className="mx-auto w-24 h-24 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-success animate-scale-in" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Registration Successful!</h2>
            <p className="text-muted-foreground">You have been registered for Field Experience Practice.</p>
          </div>
        </div>
      )}

    <div className="space-y-6">
      {/* Student Info */}
      <Card className="border-success/20 bg-success/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-success/10 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified Student</p>
                <p className="font-semibold text-lg">{studentData.name}</p>
                <p className="text-sm text-muted-foreground">ID: {studentData.id}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">GPA:</span>
                    <span className="text-sm font-semibold text-primary">{studentData.gpa.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Microteaching:</span>
                    <span className="text-sm font-semibold text-success">{studentData.microteachingGrade}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Your School & Subject</CardTitle>
          <CardDescription>
            Choose a school and teaching subject for your Field Experience Practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject Filter */}
          <div className="space-y-2">
            <Label>Filter by Subject (Optional)</Label>
            <Select value={selectedSubject} onValueChange={(value) => setSelectedSubject(value as any)}>
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

          {/* Schools Grid */}
          {isLoading ? (
            <div className="text-center py-8">Loading schools...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {schools.map((school) => {
                const isSelected = selectedSchool?.id === school.id;
                const hasAvailableSubjects = school.subjects.some(s => s.total_quota - s.registered_count > 0);
                const meetsGpaRequirement = studentData.gpa >= school.min_gpa;

                return (
                  <Card
                    key={school.id}
                    className={`transition-all duration-300 ${
                      isSelected ? "border-primary ring-2 ring-primary scale-[1.02]" : ""
                    } ${!hasAvailableSubjects || !meetsGpaRequirement ? "opacity-60" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <School className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{school.name}</h3>
                        </div>
                        {school.min_gpa > 0 && (
                          <Badge variant={meetsGpaRequirement ? "success" : "destructive"} className="text-xs">
                            Min GPA: {school.min_gpa.toFixed(1)}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{school.location}</p>
                      
                      {!meetsGpaRequirement && (
                        <p className="text-xs text-destructive mb-3">
                          Your GPA ({studentData.gpa.toFixed(2)}) does not meet the minimum requirement
                        </p>
                      )}

                      {/* Map Display when selected */}
                      {isSelected && school.latitude && school.longitude && (
                        <div className="mb-4 rounded-lg overflow-hidden border animate-fade-in">
                          <iframe
                            width="100%"
                            height="200"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${school.latitude},${school.longitude}&zoom=15`}
                            allowFullScreen
                          />
                          {school.address && (
                            <div className="p-2 bg-muted text-xs">
                              <p className="text-muted-foreground">{school.address}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Available Subjects:</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {school.subjects.map((subject) => {
                            const status = getQuotaStatus(subject);
                            const available = subject.total_quota - subject.registered_count;
                            const isAvailable = available > 0;
                            const isSubjectSelected = isSelected && selectedSubjectForSchool === subject.subject;

                            return (
                              <div
                                key={subject.quotaId}
                                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                  isSubjectSelected ? "border-primary bg-primary/5" : ""
                                } ${!isAvailable || !meetsGpaRequirement ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() => {
                                  if (isAvailable && meetsGpaRequirement) {
                                    setSelectedSchool(school);
                                    setSelectedSubjectForSchool(subject.subject);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {subject.subject.charAt(0).toUpperCase() + subject.subject.slice(1)}
                                    </Badge>
                                    <Badge variant={status.color as any} className="text-xs">
                                      {status.label}
                                    </Badge>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">{available}</strong>/{subject.total_quota}
                                  </span>
                                </div>
                                
                                {/* Quota Bar */}
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      status.color === "success"
                                        ? "bg-success"
                                        : status.color === "warning"
                                        ? "bg-warning"
                                        : "bg-destructive"
                                    }`}
                                    style={{
                                      width: `${(available / subject.total_quota) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {schools.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No schools found. Try adjusting your filters.
            </div>
          )}

          {/* Register Button */}
          {selectedSchool && selectedSubjectForSchool && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Selected School & Subject</p>
                  <p className="font-semibold">{selectedSchool.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSchool.location}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedSubjectForSchool.charAt(0).toUpperCase() + selectedSubjectForSchool.slice(1)}
                  </Badge>
                </div>
                <Badge variant="success">Confirmed</Badge>
              </div>

              <Button onClick={handleRegister} disabled={isRegistering} size="lg" className="w-full">
                {isRegistering ? "Processing Registration..." : "Complete Registration"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default SchoolSelection;
