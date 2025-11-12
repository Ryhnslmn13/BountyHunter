import { useState } from "react";
import { GraduationCap, BookOpen, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StudentIdForm from "@/components/StudentIdForm";
import SchoolSelection from "@/components/SchoolSelection";
import ProfileSection from "@/components/ProfileSection";
import { toast } from "sonner";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<"login" | "schools">("login");
  const [studentData, setStudentData] = useState<{ id: string; name: string; hasMicroteaching: boolean; microteachingGrade: string; gpa: number } | null>(null);

  const handleStudentVerified = (data: { id: string; name: string; hasMicroteaching: boolean; microteachingGrade: string; gpa: number }) => {
    setStudentData(data);
    if (data.hasMicroteaching) {
      setCurrentStep("schools");
    } else {
      toast.error("Grade requirement not met", {
        description: "You need a minimum grade of B in Microteaching to register for Field Experience."
      });
    }
  };

  const handleRegistrationComplete = () => {
    toast.success("Registration Successful!", {
      description: "You have been registered for Field Experience Practice."
    });
    // Reset to login
    setCurrentStep("login");
    setStudentData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Field Experience Registration</h1>
                <p className="text-sm text-muted-foreground">Student Practice Program Portal</p>
              </div>
            </div>
            <ProfileSection 
              studentData={studentData} 
              onLogout={() => {
                setCurrentStep("login");
                setStudentData(null);
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Info Banner */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Important Requirements</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      Students must complete the <strong className="text-foreground">Microteaching</strong> lecture before registration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      Each school has limited placement quotas - register early
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      Valid student ID required for verification
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep === "login" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep === "login" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                1
              </div>
              <span className="font-medium hidden sm:inline">Student Verification</span>
            </div>
            <div className="h-0.5 w-12 bg-border"></div>
            <div className={`flex items-center gap-2 ${currentStep === "schools" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep === "schools" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="font-medium hidden sm:inline">School Selection</span>
            </div>
          </div>

          {/* Content Area */}
          {currentStep === "login" ? (
            <StudentIdForm onVerified={handleStudentVerified} />
          ) : (
            <SchoolSelection 
              studentData={studentData!} 
              onComplete={handleRegistrationComplete}
              onBack={() => setCurrentStep("login")}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Field Experience Registration Portal. For support, contact your academic advisor.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
