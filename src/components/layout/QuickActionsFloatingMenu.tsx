import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole } from '../../types';
import { 
  Zap, 
  CheckSquare, 
  FileText, 
  BookOpen, 
  Users, 
  Calendar, 
  Award, 
  ShieldAlert, 
  Clock, 
  UserCheck, 
  BarChart3, 
  Building2, 
  Video, 
  DoorOpen, 
  HeartPulse, 
  Bus, 
  Trophy, 
  Settings, 
  Search, 
  X, 
  ChevronRight, 
  Sparkles, 
  Laptop, 
  FileCheck2, 
  ShieldCheck, 
  AlertTriangle, 
  GraduationCap, 
  Utensils, 
  Layers,
  ArrowRight,
  User as UserIcon,
  Bell,
  HardDrive,
  Plus,
  LogOut
} from 'lucide-react';
import { TeacherAbsenceReportModal } from '../timetable/TeacherAbsenceReportModal';
import { useMobileLayout } from '../../context/MobileLayoutContext';

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  category: 'primary' | 'academic' | 'management' | 'utility';
  badge?: string;
  badgeColor?: string;
  tabTarget?: string;
  actionType?: 'nav_tab' | 'absence_modal' | 'storage_modal' | 'switch_user' | 'toggle_notif';
}

interface QuickActionsFloatingMenuProps {
  currentUser: User;
  onSwitchUser?: (user: User) => void;
}

export const QuickActionsFloatingMenu: React.FC<QuickActionsFloatingMenuProps> = ({
  currentUser,
  onSwitchUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Ctrl+K or Cmd+K to toggle Quick Actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Construct Role-Specific Action List
  const roleActions: QuickActionItem[] = useMemo(() => {
    const role = currentUser.role;

    switch (role) {
      case 'teacher':
      case 'class_teacher':
        return [
          {
            id: 'log-attendance',
            title: 'Log Class Attendance',
            subtitle: role === 'class_teacher' ? `Take daily roll call for Grade ${currentUser.grade || 4} ${currentUser.stream || 'Dove'}` : 'Mark learner presence for your subject stream',
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Primary Task',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'class_register',
            actionType: 'nav_tab'
          },
          {
            id: 'view-gradebook',
            title: 'View CBC Gradebook & Marks',
            subtitle: 'Record formative rubric scores, strand levels & summative marks',
            icon: Award,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Marks Entry',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'cbc_results',
            actionType: 'nav_tab'
          },
          {
            id: 'log-work-entry',
            title: 'Enter Lesson Work Entry',
            subtitle: 'Record syllabus strand, competencies covered & pedagogical reflections',
            icon: FileCheck2,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'primary',
            badge: 'Clock In',
            badgeColor: 'bg-blue-600 text-white',
            tabTarget: 'work_entry',
            actionType: 'nav_tab'
          },
          {
            id: 'report-absence',
            title: 'Report Absence to Leadership',
            subtitle: 'Notify Head Teacher, Deputy, Dean & Senior Teacher for relief cover',
            icon: ShieldAlert,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'primary',
            badge: 'Leadership Notice',
            badgeColor: 'bg-amber-600 text-white',
            actionType: 'absence_modal'
          },
          {
            id: 'view-timetable',
            title: 'View Teaching Timetable (Day/Week Capture)',
            subtitle: 'Inspect daily class visits, whole week panoramic matrix & clean print capture',
            icon: Calendar,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'academic',
            badge: 'Schedule',
            badgeColor: 'bg-purple-600 text-white',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'Submit Academic Reports',
            subtitle: 'Access monthly, termly & annual curriculum reporting summaries',
            icon: FileText,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
            category: 'academic',
            tabTarget: 'reporting_hub',
            actionType: 'nav_tab'
          },
          {
            id: 'create-assignment',
            title: 'Create Homework Assignment',
            subtitle: 'Publish CBC home task with rubrics, attachments and due dates',
            icon: BookOpen,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'academic',
            tabTarget: 'assignments',
            actionType: 'nav_tab'
          },
          {
            id: 'book-library',
            title: 'Book CBC Library Room',
            subtitle: 'Reserve Main Reading Hall, AV Suite or Seminar Room for your lesson',
            icon: DoorOpen,
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-700',
            category: 'management',
            tabTarget: 'library_booking',
            actionType: 'nav_tab'
          },
          ...(role === 'class_teacher' ? [{
            id: 'lunch-register',
            title: 'Learner Lunch Register',
            subtitle: 'Mark special dietary needs and meal participation check-ins',
            icon: Utensils,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'management' as const,
            tabTarget: 'lunch_register',
            actionType: 'nav_tab' as const
          }] : [])
        ];

      case 'head_teacher':
        return [
          {
            id: 'submit-report',
            title: 'Submit Executive BOM Report',
            subtitle: 'Compile, review and ratify official Board of Management termly report',
            icon: FileText,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'primary',
            badge: 'BOM Executive',
            badgeColor: 'bg-amber-600 text-white',
            tabTarget: 'bom_report',
            actionType: 'nav_tab'
          },
          {
            id: 'view-gradebook',
            title: 'View School Academic Gradebook & Results',
            subtitle: 'Monitor school-wide continuous assessments, KPSEA projections & exam means',
            icon: Award,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Gradebook',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'analytics',
            actionType: 'nav_tab'
          },
          {
            id: 'log-attendance',
            title: 'Monitor School Attendance & Daily Roll Call',
            subtitle: 'Review live student attendance rates, teacher duty logs and gate movements',
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Attendance',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'analytics',
            actionType: 'nav_tab'
          },
          {
            id: 'audit-work-entries',
            title: 'Audit Staff Work Entries',
            subtitle: 'Review teacher clock-in logs, biometric GPS stamps and lesson records',
            icon: FileCheck2,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'primary',
            badge: 'Duty Audit',
            badgeColor: 'bg-blue-600 text-white',
            tabTarget: 'work_entry_audit',
            actionType: 'nav_tab'
          },
          {
            id: 'relief-desk',
            title: 'Faculty Relief & Absence Desk',
            subtitle: 'Examine reported teacher absences and check relief substitute assignments',
            icon: UserCheck,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'academic',
            badge: 'Staff Relief',
            badgeColor: 'bg-purple-600 text-white',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'broadcast-announcement',
            title: 'Broadcast School Announcement',
            subtitle: 'Send urgent message to all teachers, parents and learners',
            icon: Bell,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'management',
            tabTarget: 'announcements',
            actionType: 'nav_tab'
          },
          {
            id: 'staff-appraisal',
            title: 'Staff TPAD Performance Appraisal',
            subtitle: 'Ratify teacher competency ratings and annual pedagogical appraisals',
            icon: Award,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
            category: 'management',
            tabTarget: 'staff_appraisal',
            actionType: 'nav_tab'
          }
        ];

      case 'deputy_head':
        return [
          {
            id: 'log-attendance',
            title: 'Log Staff Duty & Attendance Roster',
            subtitle: 'Monitor teacher presence across morning assembly, lunch and gate duties',
            icon: Clock,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Staff Duty',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'staff_duty',
            actionType: 'nav_tab'
          },
          {
            id: 'view-gradebook',
            title: 'View CBC Gradebook & Assessment Marks',
            subtitle: 'Import verified score sheets and update student gradebook records',
            icon: Award,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'primary',
            badge: 'Gradebook',
            badgeColor: 'bg-purple-600 text-white',
            tabTarget: 'results_upload',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'Submit & Moderate Report Cards',
            subtitle: 'Review, moderate and approve class teacher remarks and termly report cards',
            icon: FileCheck2,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'primary',
            badge: 'Reports',
            badgeColor: 'bg-blue-600 text-white',
            tabTarget: 'reports_moderation',
            actionType: 'nav_tab'
          },
          {
            id: 'book-relief',
            title: 'Book Relief Teachers (Colleague Absent)',
            subtitle: 'Assign substitute teachers for absent colleagues across affected lesson slots',
            icon: UserCheck,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'primary',
            badge: 'Urgent Relief',
            badgeColor: 'bg-amber-600 text-white',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'log-discipline',
            title: 'Log Student Disciplinary Incident',
            subtitle: 'Record behavioral infractions, parent summons and restorative counseling',
            icon: ShieldAlert,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'management',
            tabTarget: 'discipline',
            actionType: 'nav_tab'
          },
          {
            id: 'audit-work-ledger',
            title: 'Audit Staff Work Ledger',
            subtitle: 'Review verified teacher clock-ins and daily classroom instructional hours',
            icon: FileText,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
            category: 'management',
            tabTarget: 'work_ledger',
            actionType: 'nav_tab'
          }
        ];

      case 'dean_of_studies':
        return [
          {
            id: 'view-gradebook',
            title: 'View Gradebook & Upload Marks',
            subtitle: 'Manage continuous assessment tests, score entries and exam means',
            icon: Award,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Gradebook',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'results_upload',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'Generate & Submit Termly Report Cards',
            subtitle: 'Compile comprehensive student termly reports and KPSEA predictive rankings',
            icon: FileText,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'primary',
            badge: 'Report Cards',
            badgeColor: 'bg-blue-600 text-white',
            tabTarget: 'report_cards',
            actionType: 'nav_tab'
          },
          {
            id: 'log-attendance',
            title: 'Monitor Academic & Exam Attendance',
            subtitle: 'Track assessment attendance, student test sitting presence and exam registers',
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Roll Call',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'analytics',
            actionType: 'nav_tab'
          },
          {
            id: 'book-relief',
            title: 'Book Relief Teachers (Colleague Absent)',
            subtitle: 'Assign available teachers with free periods to cover absent colleague classes',
            icon: UserCheck,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'academic',
            badge: 'Relief Desk',
            badgeColor: 'bg-amber-600 text-white',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'auto-generate-timetable',
            title: 'Master Timetable & Autonomous Generator',
            subtitle: 'Generate conflict-free weekly schedules and teacher stream allocations',
            icon: Calendar,
            iconBg: 'bg-teal-100',
            iconColor: 'text-teal-700',
            category: 'academic',
            badge: 'Generator',
            badgeColor: 'bg-teal-600 text-white',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'faculty-allocations',
            title: 'Manage Faculty Subject Allocations',
            subtitle: 'Allocate teachers to CBC learning areas, grades and stream quotas',
            icon: Users,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'academic',
            tabTarget: 'faculty_allocations',
            actionType: 'nav_tab'
          },
          {
            id: 'curriculum-delivery',
            title: 'Curriculum Strands & Syllabi Tracking',
            subtitle: 'Verify curriculum delivery pace across junior and primary grades',
            icon: BookOpen,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
            category: 'management',
            tabTarget: 'curriculum',
            actionType: 'nav_tab'
          }
        ];

      case 'senior_teacher':
        return [
          {
            id: 'log-attendance',
            title: 'Monitor Daily Attendance & Roll Call',
            subtitle: 'Oversee school-wide daily student attendance health and prevent truancy',
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Roll Call',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'attendance_monitor',
            actionType: 'nav_tab'
          },
          {
            id: 'view-gradebook',
            title: 'View Learner Progress & Gradebook',
            subtitle: 'Supervise continuous assessment records, rubric profiles and remedial logs',
            icon: Award,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Gradebook',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'attendance_monitor',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'Submit Academic Supervision Reports',
            subtitle: 'Compile pastoral care and teaching supervision summary reports',
            icon: FileText,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
            category: 'primary',
            badge: 'Reports',
            badgeColor: 'bg-slate-700 text-white',
            tabTarget: 'reporting_hub',
            actionType: 'nav_tab'
          },
          {
            id: 'verify-gate-passes',
            title: 'Verify Gate Exit Passes',
            subtitle: 'Authorize learner departure security passes and guardian handovers',
            icon: LogOut,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'primary',
            badge: 'Gate Safety',
            badgeColor: 'bg-blue-600 text-white',
            tabTarget: 'gate_safety',
            actionType: 'nav_tab'
          },
          {
            id: 'audit-work-entries',
            title: 'Audit Teacher Work Entries',
            subtitle: 'Review teacher daily lesson delivery records, GPS logs and photos',
            icon: FileCheck2,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'academic',
            tabTarget: 'work_entry_audit',
            actionType: 'nav_tab'
          },
          {
            id: 'log-mentorship',
            title: 'Log Pastoral Mentorship Session',
            subtitle: 'Record learner guidance, character coaching & academic mentoring',
            icon: Users,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'academic',
            tabTarget: 'mentorship',
            actionType: 'nav_tab'
          },
          {
            id: 'staff-appraisal',
            title: 'Teacher Appraisal (TPAD)',
            subtitle: 'Supervise teacher professional appraisal standards and lesson observations',
            icon: Award,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'management',
            tabTarget: 'staff_appraisal',
            actionType: 'nav_tab'
          }
        ];

      case 'curriculum_coordinator':
        return [
          {
            id: 'submit-report',
            title: 'Curriculum Reports Suite & PDF Export',
            subtitle: 'Draft, edit, moderate and export comprehensive curriculum evaluation reports',
            icon: FileText,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Reports Suite',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'reports_suite',
            actionType: 'nav_tab'
          },
          {
            id: 'view-gradebook',
            title: 'View CBC Assessment Rubrics & Gradebook',
            subtitle: 'Analyze competency levels and CBA assessment rubric performance',
            icon: Award,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'primary',
            badge: 'Gradebook',
            badgeColor: 'bg-purple-600 text-white',
            tabTarget: 'cba_mapping',
            actionType: 'nav_tab'
          },
          {
            id: 'schemes-of-work',
            title: 'Review Schemes of Work Submissions',
            subtitle: 'Audit, comment and ratify termly teaching schemes submitted by teachers',
            icon: FileCheck2,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Curriculum Audit',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'schemes',
            actionType: 'nav_tab'
          },
          {
            id: 'syllabus-tracker',
            title: 'Syllabus Completion & Pacing Tracker',
            subtitle: 'Track percentage progress against national KICD syllabus guidelines',
            icon: BookOpen,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'academic',
            tabTarget: 'pacing',
            actionType: 'nav_tab'
          },
          {
            id: 'cba-tool-mappings',
            title: 'CBA Assessment Tool Mappings',
            subtitle: 'Verify competency-based assessment tasks against learning rubrics',
            icon: Award,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'academic',
            tabTarget: 'cba_mapping',
            actionType: 'nav_tab'
          }
        ];

      case 'hod':
        return [
          {
            id: 'view-gradebook',
            title: 'View Department Performance Analytics',
            subtitle: 'Evaluate grade distributions, subject mean scores and rubric proficiencies',
            icon: BarChart3,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Gradebook',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'subject_analytics',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'Submit Departmental Reports',
            subtitle: 'Compile termly pedagogical reviews and curriculum recommendations',
            icon: FileText,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
            category: 'primary',
            badge: 'Reports',
            badgeColor: 'bg-slate-700 text-white',
            tabTarget: 'reporting_hub',
            actionType: 'nav_tab'
          },
          {
            id: 'log-attendance',
            title: 'Log Department Duty & Meeting Attendance',
            subtitle: 'Record departmental minutes, teacher attendance and lesson supervision',
            icon: Clock,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Attendance',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'work_logs',
            actionType: 'nav_tab'
          },
          {
            id: 'audit-work-logs',
            title: 'Audit Department Lesson Delivery',
            subtitle: 'Inspect daily work entries and syllabus coverage for departmental teachers',
            icon: FileCheck2,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'academic',
            badge: 'Department Log',
            badgeColor: 'bg-blue-600 text-white',
            tabTarget: 'work_logs',
            actionType: 'nav_tab'
          },
          {
            id: 'syllabus-coverage',
            title: 'Verify Syllabus Strands & Topics',
            subtitle: 'Monitor departmental progress across curriculum strands and lesson notes',
            icon: BookOpen,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'academic',
            tabTarget: 'syllabus',
            actionType: 'nav_tab'
          }
        ];

      case 'student':
        return [
          {
            id: 'view-gradebook',
            title: 'View Gradebook & Assessment Results',
            subtitle: 'Check CBC rubric levels, subject grades, and formative teacher remarks',
            icon: Award,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'My Grades',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'results',
            actionType: 'nav_tab'
          },
          {
            id: 'log-attendance',
            title: 'View My Daily Attendance Record',
            subtitle: 'Check roll call check-in history, presence percentage and punctuality',
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Roll Call',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'attendance',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'Submit Homework & Assignments',
            subtitle: 'Turn in completed CBC assignments and check teacher evaluation feedback',
            icon: BookOpen,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'primary',
            badge: 'Tasks',
            badgeColor: 'bg-rose-600 text-white',
            tabTarget: 'assignments',
            actionType: 'nav_tab'
          },
          {
            id: 'view-timetable',
            title: 'View Class Timetable & Today Lessons',
            subtitle: 'Inspect today routine, period timings, classrooms and subject teachers',
            icon: Calendar,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'primary',
            badge: 'Today Route',
            badgeColor: 'bg-purple-600 text-white',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'explore-resources',
            title: 'Explore Curriculum Notes & Videos',
            subtitle: 'Access digital lesson notes, video tutorials, audio podcasts & diagrams',
            icon: Laptop,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'academic',
            tabTarget: 'resources',
            actionType: 'nav_tab'
          },
          {
            id: 'view-badges',
            title: 'Check Study Badges & Gamification XP',
            subtitle: 'Track your learning achievements, points, quest completion & level rank',
            icon: Trophy,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'academic',
            tabTarget: 'badges',
            actionType: 'nav_tab'
          },
          {
            id: 'eportfolio',
            title: 'Open Learner ePortfolio',
            subtitle: 'Showcase your practical projects, scientific investigations & digital creations',
            icon: Layers,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'academic',
            tabTarget: 'eportfolio',
            actionType: 'nav_tab'
          }
        ];

      case 'parent':
        return [
          {
            id: 'view-gradebook',
            title: 'View Child Gradebook & Report Cards',
            subtitle: 'Review termly assessment sheets, teacher comments, and grade trajectories',
            icon: Award,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Report Card',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'report_cards',
            actionType: 'nav_tab'
          },
          {
            id: 'log-attendance',
            title: 'Check Daily Attendance Health',
            subtitle: 'Verify student check-in timestamps, roll call status and attendance health',
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Attendance',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'attendance',
            actionType: 'nav_tab'
          },
          {
            id: 'track-homework',
            title: 'Track Homework Assignments',
            subtitle: 'Check pending CBC tasks, submission deadlines and teacher instructions',
            icon: BookOpen,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'primary',
            tabTarget: 'assignments',
            actionType: 'nav_tab'
          },
          {
            id: 'view-timetable',
            title: 'View Class Timetable',
            subtitle: 'Inspect weekly routine schedules, bell timings and subject venues',
            icon: Calendar,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'academic',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'fee-statement',
            title: 'Fee Statement & Digital Receipts',
            subtitle: 'Track tuition balance, invoices, payments, and instant clearance receipts',
            icon: FileText,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'management',
            tabTarget: 'finance',
            actionType: 'nav_tab'
          },
          {
            id: 'gate-exit-request',
            title: 'Submit Gate Exit Authorization',
            subtitle: 'Issue verified guardian departure pass for medical or domestic leave',
            icon: LogOut,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'management',
            tabTarget: 'gate_exit',
            actionType: 'nav_tab'
          }
        ];

      case 'librarian':
        return [
          {
            id: 'circulation-desk',
            title: 'Issue / Return Library Books',
            subtitle: 'Process book lending and returns for learners and academic faculty',
            icon: BookOpen,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Circulation',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'circulation',
            actionType: 'nav_tab'
          },
          {
            id: 'room-reservations',
            title: 'Manage Room Reservations',
            subtitle: 'Approve teacher bookings for Reading Hall, AV Suite and Discussion Rooms',
            icon: DoorOpen,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'primary',
            badge: 'Rooms',
            badgeColor: 'bg-purple-600 text-white',
            tabTarget: 'rooms',
            actionType: 'nav_tab'
          },
          {
            id: 'new-acquisitions',
            title: 'Catalog New Book Acquisitions',
            subtitle: 'Add new CBC textbooks, reference manuals and digital resources to inventory',
            icon: Plus,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'academic',
            tabTarget: 'acquisitions',
            actionType: 'nav_tab'
          }
        ];

      case 'nurse':
        return [
          {
            id: 'log-attendance',
            title: 'Log Health Triage Visit',
            subtitle: 'Record student medical visits, symptoms, vitals and nursing interventions',
            icon: HeartPulse,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'primary',
            badge: 'Clinic Triage',
            badgeColor: 'bg-rose-600 text-white',
            tabTarget: 'triage',
            actionType: 'nav_tab'
          },
          {
            id: 'dispensary-log',
            title: 'Dispensary & Medication Register',
            subtitle: 'Administer prescribed medicine and record dispensary stock balances',
            icon: Award,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700',
            category: 'primary',
            tabTarget: 'dispensary',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'Submit Sanatorium Health Report',
            subtitle: 'Compile monthly student wellness, epidemiological trends and clinic logs',
            icon: FileText,
            iconBg: 'bg-slate-100',
            iconColor: 'text-slate-700',
            category: 'academic',
            tabTarget: 'reports',
            actionType: 'nav_tab'
          }
        ];

      case 'transport_team':
        return [
          {
            id: 'log-attendance',
            title: 'Log Daily Bus Trip & Roll Call',
            subtitle: 'Record morning and evening bus route passenger roll call check-ins',
            icon: Bus,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700',
            category: 'primary',
            badge: 'Bus Route',
            badgeColor: 'bg-amber-600 text-white',
            tabTarget: 'trips',
            actionType: 'nav_tab'
          },
          {
            id: 'report-incident',
            title: 'Report Transport Route Incident',
            subtitle: 'Log traffic delays, mechanical alerts or safety incidents',
            icon: AlertTriangle,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-700',
            category: 'primary',
            tabTarget: 'incidents',
            actionType: 'nav_tab'
          }
        ];

      case 'cocurricular_team':
        return [
          {
            id: 'log-attendance',
            title: 'Log Activities Attendance',
            subtitle: 'Mark roll call for sports teams, clubs, scouting and musical bands',
            icon: Trophy,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Activities',
            badgeColor: 'bg-emerald-600 text-white',
            tabTarget: 'attendance',
            actionType: 'nav_tab'
          },
          {
            id: 'register-competition',
            title: 'Register Tournament Fixture',
            subtitle: 'Schedule inter-school matches, drama festival entries and music galas',
            icon: Calendar,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            tabTarget: 'competitions',
            actionType: 'nav_tab'
          }
        ];

      case 'admin':
      default:
        return [
          {
            id: 'user-management',
            title: 'Manage Users & Role Permissions',
            subtitle: 'Create users, assign academic privileges, and configure roles',
            icon: Users,
            iconBg: 'bg-slate-900',
            iconColor: 'text-white',
            category: 'primary',
            badge: 'Admin Core',
            badgeColor: 'bg-slate-900 text-white',
            tabTarget: 'users',
            actionType: 'nav_tab'
          },
          {
            id: 'log-attendance',
            title: 'School Attendance & Clock-In Oversight',
            subtitle: 'Audit learner attendance rates and teacher biometric GPS duty records',
            icon: UserCheck,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'primary',
            badge: 'Attendance',
            badgeColor: 'bg-emerald-700 text-white',
            tabTarget: 'oversight',
            actionType: 'nav_tab'
          },
          {
            id: 'view-gradebook',
            title: 'Academic Gradebook & Results Console',
            subtitle: 'Inspect school-wide continuous assessments and exam performance',
            icon: Award,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-700',
            category: 'primary',
            badge: 'Gradebook',
            badgeColor: 'bg-indigo-600 text-white',
            tabTarget: 'analytics',
            actionType: 'nav_tab'
          },
          {
            id: 'view-timetable',
            title: 'Master Timetable Infrastructure',
            subtitle: 'Configure class streams, bell schedules and faculty allocations',
            icon: Calendar,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700',
            category: 'academic',
            tabTarget: 'timetable',
            actionType: 'nav_tab'
          },
          {
            id: 'submit-report',
            title: 'System Audit Logs & Security Reports',
            subtitle: 'Inspect verified digital access logs, role changes and security audits',
            icon: FileCheck2,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-700',
            category: 'management',
            tabTarget: 'logs',
            actionType: 'nav_tab'
          }
        ];
    }
  }, [currentUser]);

  // System Utility Actions available to all logged-in users
  const utilityActions: QuickActionItem[] = useMemo(() => [
    {
      id: 'storage-settings',
      title: 'Storage & Offline CBC Cache Management',
      subtitle: 'Inspect local storage usage by subject and clear module cache',
      icon: HardDrive,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      category: 'utility',
      badge: 'Offline PWA',
      badgeColor: 'bg-emerald-700 text-white',
      actionType: 'storage_modal'
    },
    {
      id: 'switch-user-persona',
      title: 'Quick Switch User / Role Persona',
      subtitle: 'Seamlessly test teacher, student, head teacher, dean or admin perspectives',
      icon: UserIcon,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      category: 'utility',
      actionType: 'switch_user'
    }
  ], []);

  // Combined and filtered action items based on search input
  const allFilteredActions = useMemo(() => {
    const list = [...roleActions, ...utilityActions];
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.subtitle.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [roleActions, utilityActions, searchQuery]);

  // Execute an action
  const handleExecuteAction = (action: QuickActionItem) => {
    setIsOpen(false);

    if (action.actionType === 'absence_modal') {
      setShowAbsenceModal(true);
      return;
    }

    if (action.actionType === 'storage_modal') {
      window.dispatchEvent(new CustomEvent('open-storage-settings'));
      return;
    }

    if (action.actionType === 'switch_user') {
      // Find switch user button in navbar or dispatch event
      const switchBtn = document.querySelector('button[title*="Switch User"], button[title*="Quick Switch"]') as HTMLButtonElement | null;
      if (switchBtn) {
        switchBtn.click();
      } else {
        window.dispatchEvent(new CustomEvent('open-user-switch-modal'));
      }
      return;
    }

    if (action.actionType === 'nav_tab' && action.tabTarget) {
      window.dispatchEvent(new CustomEvent('workspace-nav-tab', { detail: action.tabTarget }));
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setToastMessage(`Switched to: ${action.title}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Keyboard navigation inside action list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % (allFilteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + (allFilteredActions.length || 1)) % (allFilteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allFilteredActions[activeIndex]) {
        handleExecuteAction(allFilteredActions[activeIndex]);
      }
    }
  };

  // Format friendly role title
  const friendlyRoleTitle = useMemo(() => {
    switch (currentUser.role) {
      case 'student': return 'Learner';
      case 'parent': return 'Parent';
      case 'teacher': return 'Subject Teacher';
      case 'class_teacher': return `Class Teacher (${currentUser.grade || 4} ${currentUser.stream || 'Dove'})`;
      case 'hod': return 'Head of Department';
      case 'senior_teacher': return 'Senior Teacher';
      case 'deputy_head': return 'Deputy Head';
      case 'dean_of_studies': return 'Dean of Studies';
      case 'curriculum_coordinator': return 'Curriculum Coordinator';
      case 'head_teacher': return 'Head Teacher';
      case 'librarian': return 'School Librarian';
      case 'nurse': return 'Sanatorium Nurse';
      case 'transport_team': return 'Transport Lead';
      case 'cocurricular_team': return 'Co-Curricular Lead';
      case 'admin': return 'System Administrator';
      default: return 'Faculty Staff';
    }
  }, [currentUser]);

  const { 
    isMobileOverlapProtectionEnabled, 
    isQuickActionsDocked, 
    toggleQuickActionsDocked, 
    isMobileViewport 
  } = useMobileLayout();

  // If docked or minimized on mobile to prevent overlapping
  const isMinimizedOnMobile = isMobileViewport && (isQuickActionsDocked || isMobileOverlapProtectionEnabled);

  return (
    <>
      {/* ACTION TRIGGER BUTTON (BOTTOM-RIGHT MAIN VIEWPORT OR DOCKED BOTTOM STRIP) */}
      <aside 
        aria-label="Quick Actions Floating Menu" 
        className={`fixed z-40 print:hidden flex items-center gap-1.5 transition-all duration-300 ${
          isMinimizedOnMobile
            ? 'bottom-3 right-3 sm:bottom-6 sm:right-6'
            : 'bottom-4 right-4 sm:bottom-6 sm:right-6'
        }`}
      >
        {/* Floating Quick Actions Trigger Pill */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`group flex items-center gap-2 rounded-2xl shadow-xl transition-all duration-300 cursor-pointer ${
            isMinimizedOnMobile
              ? 'p-2 sm:px-4 sm:py-2.5 rounded-full sm:rounded-2xl bg-slate-900/90 backdrop-blur-xs text-white border border-indigo-400/40 shadow-lg hover:scale-105 active:scale-95'
              : isOpen 
              ? 'px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-900 text-white ring-2 ring-indigo-500 shadow-indigo-500/25' 
              : 'px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white hover:from-indigo-900 hover:to-slate-900 shadow-slate-900/40 hover:shadow-2xl hover:scale-105 active:scale-95 border border-indigo-500/30'
          }`}
          title={
            isMinimizedOnMobile
              ? `Quick Actions (${currentUser.role.replace('_', ' ')}) · Press to open`
              : "Quick Actions floating menu (Press Ctrl+K or Cmd+K)"
          }
          aria-expanded={isOpen}
        >
          <div className="relative">
            <span className="flex h-2.5 w-2.5 absolute -top-0.5 -right-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400 transition-transform group-hover:rotate-12" />
            </div>
          </div>

          {!isMinimizedOnMobile && (
            <>
              <div className="text-left">
                <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
                  <span>Quick Actions</span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 leading-none mt-0.5 hidden sm:block">
                  Perform role-specific tasks
                </div>
              </div>

              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-300 bg-slate-800/80 rounded border border-slate-700 ml-1">
                <span>⌘</span>
                <span>K</span>
              </kbd>
            </>
          )}
        </button>

        {/* Mobile Overlap Protection Minimize/Dock Toggle Icon */}
        {isMobileViewport && (
          <button
            onClick={toggleQuickActionsDocked}
            className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-mono shadow-xs border border-slate-600 cursor-pointer"
            title={isQuickActionsDocked ? "Expand Quick Actions pill" : "Dock pill to prevent screen overlapping"}
            aria-label="Toggle Quick Actions size"
          >
            {isQuickActionsDocked ? '↗' : '↙'}
          </button>
        )}
      </aside>

      {/* FLOATING ACTION MENU POPOVER MODAL */}
      {isOpen && (
        <div 
          ref={menuRef}
          className="fixed bottom-20 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[82vh] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:hidden"
        >
          {/* HEADER: Role Badge & Identity */}
          <div className="p-4 sm:px-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0 border-b border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center font-bold text-amber-300 shadow-2xs">
                  <Zap className="w-5 h-5 fill-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded">
                      {friendlyRoleTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentUser.name}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mt-0.5">
                    Role-Specific Quick Actions
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close Quick Actions (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Task Search Box */}
            <div className="relative mt-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search action... (e.g. attendance, gradebook, report)"
                className="w-full pl-8.5 pr-8 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* ACTION ITEMS SCROLLABLE LIST */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[58vh]">
            
            {allFilteredActions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No matching quick action found</div>
                <div className="text-[11px] text-slate-400">Try searching for "attendance", "gradebook", "report", or "timetable"</div>
              </div>
            ) : (
              <>
                {/* 1. PRIMARY ROLE ACTIONS */}
                {allFilteredActions.some(a => a.category === 'primary') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1.5 pb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Primary Role Tasks
                      </span>
                      <span className="text-[10px] text-indigo-600 font-bold">
                        {friendlyRoleTitle}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {allFilteredActions
                        .filter(a => a.category === 'primary')
                        .map((action, idx) => {
                          const IconComponent = action.icon;
                          const isHighlighted = allFilteredActions.indexOf(action) === activeIndex;

                          return (
                            <button
                              key={action.id}
                              onClick={() => handleExecuteAction(action)}
                              onMouseEnter={() => setActiveIndex(allFilteredActions.indexOf(action))}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 group cursor-pointer border ${
                                isHighlighted
                                  ? 'bg-indigo-50/80 border-indigo-200 shadow-2xs'
                                  : 'hover:bg-slate-50 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-lg ${action.iconBg} ${action.iconColor} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-900">
                                      {action.title}
                                    </span>
                                    {action.badge && (
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${action.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                                        {action.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                    {action.subtitle}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-2 transition-transform ${isHighlighted ? 'translate-x-0.5 text-indigo-600' : ''}`} />
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 2. ACADEMIC & CURRICULUM ACTIONS */}
                {allFilteredActions.some(a => a.category === 'academic') && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="px-1.5 pb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Academic & Operational Workflows
                      </span>
                    </div>

                    <div className="space-y-1">
                      {allFilteredActions
                        .filter(a => a.category === 'academic')
                        .map(action => {
                          const IconComponent = action.icon;
                          const isHighlighted = allFilteredActions.indexOf(action) === activeIndex;

                          return (
                            <button
                              key={action.id}
                              onClick={() => handleExecuteAction(action)}
                              onMouseEnter={() => setActiveIndex(allFilteredActions.indexOf(action))}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 group cursor-pointer border ${
                                isHighlighted
                                  ? 'bg-indigo-50/80 border-indigo-200 shadow-2xs'
                                  : 'hover:bg-slate-50 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-lg ${action.iconBg} ${action.iconColor} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                                      {action.title}
                                    </span>
                                    {action.badge && (
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${action.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                                        {action.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                    {action.subtitle}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-2 transition-transform ${isHighlighted ? 'translate-x-0.5 text-indigo-600' : ''}`} />
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 3. MANAGEMENT & INSTITUTIONAL UTILITIES */}
                {allFilteredActions.some(a => a.category === 'management') && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="px-1.5 pb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Governance & Institutional Controls
                      </span>
                    </div>

                    <div className="space-y-1">
                      {allFilteredActions
                        .filter(a => a.category === 'management')
                        .map(action => {
                          const IconComponent = action.icon;
                          const isHighlighted = allFilteredActions.indexOf(action) === activeIndex;

                          return (
                            <button
                              key={action.id}
                              onClick={() => handleExecuteAction(action)}
                              onMouseEnter={() => setActiveIndex(allFilteredActions.indexOf(action))}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 group cursor-pointer border ${
                                isHighlighted
                                  ? 'bg-indigo-50/80 border-indigo-200 shadow-2xs'
                                  : 'hover:bg-slate-50 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-lg ${action.iconBg} ${action.iconColor} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                                      {action.title}
                                    </span>
                                    {action.badge && (
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${action.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                                        {action.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                    {action.subtitle}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-2 transition-transform ${isHighlighted ? 'translate-x-0.5 text-indigo-600' : ''}`} />
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 4. SYSTEM UTILITIES */}
                {allFilteredActions.some(a => a.category === 'utility') && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="px-1.5 pb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        System & Offline Cache Tools
                      </span>
                    </div>

                    <div className="space-y-1">
                      {allFilteredActions
                        .filter(a => a.category === 'utility')
                        .map(action => {
                          const IconComponent = action.icon;
                          const isHighlighted = allFilteredActions.indexOf(action) === activeIndex;

                          return (
                            <button
                              key={action.id}
                              onClick={() => handleExecuteAction(action)}
                              onMouseEnter={() => setActiveIndex(allFilteredActions.indexOf(action))}
                              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 group cursor-pointer border ${
                                isHighlighted
                                  ? 'bg-indigo-50/80 border-indigo-200 shadow-2xs'
                                  : 'hover:bg-slate-50 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-lg ${action.iconBg} ${action.iconColor} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                                      {action.title}
                                    </span>
                                    {action.badge && (
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${action.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                                        {action.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                    {action.subtitle}
                                  </p>
                                </div>
                              </div>

                              <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-2 transition-transform ${isHighlighted ? 'translate-x-0.5 text-indigo-600' : ''}`} />
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* FOOTER: Quick Tips & Navigation Shortcuts */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                ↑↓ to navigate
              </span>
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                ↵ to select
              </span>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('open-storage-settings'));
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <HardDrive className="w-3 h-3" />
              <span>Offline Storage</span>
            </button>
          </div>

        </div>
      )}

      {/* FEEDBACK TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Teacher Absence Reporting Modal */}
      <TeacherAbsenceReportModal
        currentUser={currentUser}
        isOpen={showAbsenceModal}
        onClose={() => setShowAbsenceModal(false)}
        onReportSubmitted={() => {
          setToastMessage('Absence notification dispatched to leadership');
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </>
  );
};
