import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentIdFormProps {
  onVerified: (data: { id: string; name: string; hasMicroteaching: boolean; microteachingGrade: string; gpa: number }) => void;
}

const StudentIdForm = ({ onVerified }: StudentIdFormProps) => {
  const [studentId, setStudentId] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const gradeToNumeric = (grade: string): number => {
    const gradeMap: Record<string, number> = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0
    };
    return gradeMap[grade] || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId.trim()) return;

    setIsChecking(true);
    
    try {
      // Query the students table for the student ID
      const { data: student, error } = await supabase
        .from('students')
        .select('student_id, name, has_microteaching, microteaching_grade, gpa')
        .eq('student_id', studentId.trim())
        .maybeSingle();

      if (error) throw error;

      if (!student) {
        toast.error("Student not found", {
          description: "Please check your student ID and try again."
        });
        setIsChecking(false);
        return;
      }

      // Check microteaching grade requirement (must be B or higher)
      const gradeValue = gradeToNumeric(student.microteaching_grade || 'F');
      const minimumGrade = 3.0; // B grade

      onVerified({
        id: student.student_id,
        name: student.name,
        hasMicroteaching: student.has_microteaching && gradeValue >= minimumGrade,
        microteachingGrade: student.microteaching_grade || 'N/A',
        gpa: student.gpa || 0
      });

      setIsChecking(false);
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.message || "Please try again later"
      });
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Student Verification</CardTitle>
          <CardDescription>
            Enter your student ID to check eligibility and begin registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="text-lg"
                disabled={isChecking}
                required
              />
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
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Requirements:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Must have completed Microteaching lecture
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Minimum grade of <strong>B</strong> in Microteaching
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentIdForm;
