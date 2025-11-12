import { useState } from "react";
import { User, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileSectionProps {
  studentData: {
    id: string;
    name: string;
    gpa: number;
    microteachingGrade: string;
  } | null;
  onLogout: () => void;
}

const ProfileSection = ({ studentData, onLogout }: ProfileSectionProps) => {
  if (!studentData) return null;

  const initials = studentData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-card" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{studentData.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              ID: {studentData.id}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">GPA:</span>
            <span className="font-semibold text-primary">{studentData.gpa.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Microteaching:</span>
            <span className="font-semibold text-success">{studentData.microteachingGrade}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileSection;
