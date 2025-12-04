import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

interface StudentIdFormProps {
  onVerified: (data: { id: string; name: string; hasMicroteaching: boolean; microteachingGrade: string; gpa: number }) => void;
}

// Dummy data untuk siswa
const DUMMY_STUDENTS = [
  {
    student_id: "12345678",
    name: "Ahmad Fauzi",
    has_microteaching: true,
    microteaching_grade: "A",
    gpa: 3.75
  },
  {
    student_id: "23456789",
    name: "Siti Nurhaliza",
    has_microteaching: true,
    microteaching_grade: "B+",
    gpa: 3.45
  },
  {
    student_id: "34567890",
    name: "Budi Santoso",
    has_microteaching: false,
    microteaching_grade: "C",
    gpa: 2.80
  },
  {
    student_id: "45678901",
    name: "Dewi Anggraini",
    has_microteaching: true,
    microteaching_grade: "A-",
    gpa: 3.65
  },
  {
    student_id: "56789012",
    name: "Joko Widodo",
    has_microteaching: true,
    microteaching_grade: "B",
    gpa: 3.20
  },
  {
    student_id: "67890123",
    name: "Luffy",
    has_microteaching: true,
    microteaching_grade: "A",
    gpa: 3.80
  },
    {
    student_id: "11223344",
    name: "Sanji",
    has_microteaching: true,
    microteaching_grade: "A+",
    gpa: 3.90
  },
  // Tambahan untuk testing berbagai kasus
  {
    student_id: "78901234",
    name: "Test Student 1",
    has_microteaching: true,
    microteaching_grade: "C+", // Dibawah B, tidak memenuhi
    gpa: 2.50
  },
  {
    student_id: "89012345",
    name: "Test Student 2",
    has_microteaching: false, // Tidak ambil microteaching
    microteaching_grade: "N/A",
    gpa: 3.00
  }
];

const StudentIdForm = ({ onVerified }: StudentIdFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    passed: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  const gradeToNumeric = (grade: string): number => {
    const gradeMap: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0
    };
    return gradeMap[grade] || 0;
  };

  const gradeToStatus = (grade: string): { color: string; label: string } => {
    const gradeValue = gradeToNumeric(grade);
    
    if (gradeValue >= 3.0) return { color: "text-green-600", label: "Meets Requirement" };
    if (gradeValue >= 2.0) return { color: "text-amber-600", label: "Below Minimum" };
    return { color: "text-red-600", label: "Does Not Meet" };
  };

  const checkRequirements = (student: any) => {
    const requirements = [];
    const gradeValue = gradeToNumeric(student.microteaching_grade || 'F');
    
    // Requirement 1: Harus ambil microteaching
    if (!student.has_microteaching) {
      requirements.push({
        passed: false,
        message: "Must have taken Microteaching lecture",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      });
    } else {
      requirements.push({
        passed: true,
        message: "Microteaching lecture completed",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
    }
    
    // Requirement 2: Grade minimum B (3.0)
    if (gradeValue < 3.0) {
      requirements.push({
        passed: false,
        message: `Microteaching grade ${student.microteaching_grade} is below minimum (B)`,
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      });
    } else {
      requirements.push({
        passed: true,
        message: `Microteaching grade ${student.microteaching_grade} meets requirement`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
    }
    
    // Requirement 3: GPA minimum 2.75 (jika ada)
    if (student.gpa < 2.75) {
      requirements.push({
        passed: false,
        message: `GPA ${student.gpa.toFixed(2)} is below minimum (2.75)`,
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      });
    } else {
      requirements.push({
        passed: true,
        message: `GPA ${student.gpa.toFixed(2)} meets requirement`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
    }
    
    const allPassed = requirements.every(req => req.passed);
    
    return {
      allPassed,
      requirements
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim()) return;

    setIsChecking(true);
    setVerificationResult(null);
    
    // Simulasi delay loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Cari siswa di data dummy
      const student = DUMMY_STUDENTS.find(s => s.student_id === studentId.trim());
      
      if (!student) {
        setVerificationResult({
          passed: false,
          message: "Student ID not found",
          details: ["Please check your student ID", "Contact administration if issue persists"]
        });
        
        toast.error("Student not found", {
          description: "Please check your student ID and try again."
        });
        setIsChecking(false);
        return;
      }

      // Check requirements
      const requirementCheck = checkRequirements(student);
      
      if (!requirementCheck.allPassed) {
        const failedRequirements = requirementCheck.requirements.filter(req => !req.passed);
        
        setVerificationResult({
          passed: false,
          message: "Does not meet all requirements",
          details: failedRequirements.map(req => req.message)
        });
        
        toast.error("Requirements not met", {
          description: "Please check your microteaching grade and GPA requirements."
        });
        setIsChecking(false);
        return;
      }

      // Semua syarat terpenuhi
      setVerificationResult({
        passed: true,
        message: "All requirements met!",
        details: requirementCheck.requirements.map(req => req.message)
      });

      onVerified({
        id: student.student_id,
        name: student.name,
        hasMicroteaching: student.has_microteaching,
        microteachingGrade: student.microteaching_grade || 'N/A',
        gpa: student.gpa || 0
      });

      toast.success("Verification successful!", {
        description: `Welcome, ${student.name}!`
      });
      
      setIsChecking(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setVerificationResult({
        passed: false,
        message: "Verification error",
        details: [message || "Please try again later"]
      });
      
      toast.error("Verification failed", {
        description: message || "Please try again later"
      });
      setIsChecking(false);
    }
  };

  // Demo hint untuk user
  const handleDemoHint = (id: string) => {
    const student = DUMMY_STUDENTS.find(s => s.student_id === id);
    if (student) {
      setStudentId(student.student_id);
      const requirementCheck = checkRequirements(student);
      
      toast.info("Demo ID filled", {
        description: `${student.name} (${requirementCheck.allPassed ? '✅ Eligible' : '❌ Not Eligible'})`
      });
    }
  };

  const clearForm = () => {
    setStudentId("");
    setVerificationResult(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Student Verification
          </CardTitle>
          <CardDescription>
            Enter your student ID to check eligibility for Field Experience Practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter your student ID (e.g., 12345678)"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setVerificationResult(null);
                }}
                className="text-lg font-mono"
                disabled={isChecking}
                required
              />
              
              {/* Demo IDs Quick Select */}
              <div className="flex flex-wrap gap-2 mt-2">
                <p className="text-xs text-muted-foreground w-full">Demo IDs:</p>
                {DUMMY_STUDENTS.slice(0, 5).map((student) => (
                  <Button
                    key={student.student_id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleDemoHint(student.student_id)}
                    disabled={isChecking}
                  >
                    {student.student_id}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={!studentId.trim() || isChecking}
              size="lg"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
            
            {studentId && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={clearForm}
                disabled={isChecking}
              >
                Clear
              </Button>
            )}
          </form>

          {/* Verification Result Display */}
          {verificationResult && (
            <div className={`mt-6 p-4 rounded-lg border ${
              verificationResult.passed 
                ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  verificationResult.passed 
                    ? "bg-green-100 text-green-600 dark:bg-green-900/40" 
                    : "bg-red-100 text-red-600 dark:bg-red-900/40"
                }`}>
                  {verificationResult.passed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    verificationResult.passed ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"
                  }`}>
                    {verificationResult.message}
                  </h3>
                  
                  {verificationResult.details && verificationResult.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {verificationResult.details.map((detail, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full mt-1.5 ${
                            verificationResult.passed ? "bg-green-500" : "bg-red-500"
                          }`} />
                          <span className={
                            verificationResult.passed 
                              ? "text-green-700 dark:text-green-400" 
                              : "text-red-700 dark:text-red-400"
                          }>
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Requirements Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-800 dark:text-blue-300">Eligibility Requirements</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="p-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Microteaching Lecture</p>
                  <p className="text-xs text-muted-foreground">Must have completed Microteaching course</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="p-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Minimum Grade</p>
                  <p className="text-xs text-muted-foreground">Grade B or higher in Microteaching</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="p-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">GPA Requirement</p>
                  <p className="text-xs text-muted-foreground">Minimum cumulative GPA of 2.75</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Data Table (Demo Only) */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Available Demo Students:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">ID</th>
                    <th className="text-left p-1">Name</th>
                    <th className="text-left p-1">GPA</th>
                    <th className="text-left p-1">Microteaching</th>
                    <th className="text-left p-1">Grade</th>
                    <th className="text-left p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DUMMY_STUDENTS.map((student) => {
                    const gradeStatus = gradeToStatus(student.microteaching_grade);
                    const eligible = student.has_microteaching && 
                                    gradeToNumeric(student.microteaching_grade) >= 3.0 && 
                                    student.gpa >= 2.75;
                    
                    return (
                      <tr key={student.student_id} className="border-b hover:bg-muted/30">
                        <td className="p-1 font-mono">{student.student_id}</td>
                        <td className="p-1">{student.name}</td>
                        <td className="p-1">{student.gpa.toFixed(2)}</td>
                        <td className="p-1">
                          {student.has_microteaching ? "✅" : "❌"}
                        </td>
                        <td className={`p-1 ${gradeStatus.color}`}>
                          {student.microteaching_grade}
                        </td>
                        <td className="p-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            eligible 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {eligible ? "Eligible" : "Not Eligible"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentIdForm;