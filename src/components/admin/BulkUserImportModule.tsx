import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  GradeLevel, 
  StreamName,
  PRIMARY_STREAMS,
  JUNIOR_STREAMS,
  getStreamsForGrade,
  OnboardingBatchRecord
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Users, 
  UserPlus, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Printer, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  X,
  ArrowRight,
  Database,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface BulkUserImportModuleProps {
  currentUser: User;
  onSuccessNotification?: (msg: string) => void;
}

export interface StagingRecord {
  id: string; // temporary staging ID
  selected: boolean;
  name: string;
  role: UserRole;
  grade?: GradeLevel;
  stream?: StreamName;
  admissionNumber?: string;
  email: string;
  phone?: string;
  tscNumber?: string;
  designation?: string;
  department?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  gender?: 'Male' | 'Female' | 'Other';
  specialNotes?: string;
  status: 'valid' | 'warning' | 'error';
  validationMessages: string[];
  isExistingMatch?: boolean;
}

// Sample Templates as downloadable CSV and for clipboard
const STUDENT_TEMPLATE_CSV = `admission_number,full_name,grade,stream,gender,parent_name,parent_phone,parent_email,special_notes
ADM/2026/0501,Faith Wangari Nduta,4,Dove,Female,Grace Nduta,+254712000111,grace.nduta@gmail.com,Asthma inhaler in bag
ADM/2026/0502,Brian Kiprono Koech,4,Eagle,Male,David Koech,+254722000222,david.koech@gmail.com,None
ADM/2026/0503,Amina Fatuma Hassan,7,Mara,Female,Hassan Omar,+254733000333,hassan.omar@gmail.com,Halal meal preference
ADM/2026/0504,Kelvin Otieno Ouma,8,Kerio,Male,Jane Ouma,+254744000444,jane.ouma@gmail.com,Vegetarian diet
ADM/2026/0505,Mercy Chebet Langat,1,Swan,Female,Peter Langat,+254755000555,peter.langat@gmail.com,Allergic to peanuts`;

const STAFF_TEMPLATE_CSV = `full_name,email,role,tsc_or_id_number,designation,phone,department,assigned_grade,assigned_stream
Mr. James Kimani,j.kimani@edusmart.ac.ke,teacher,TSC/78129/ED,Senior Mathematics & Computing Teacher,+254711223344,Sciences & Mathematics,4,Dove
Madame Alice Mutiso,a.mutiso@edusmart.ac.ke,class_teacher,TSC/89201/ED,Class Teacher Grade 7 Mara,+254722334455,Languages,7,Mara
Nurse Beatrice Njeri,b.njeri@edusmart.ac.ke,nurse,NCK/RN-69102,Associate Nursing Officer · Sanatorium,+254733445566,Healthcare,4,Dove
Driver Samuel Wanyonyi,s.wanyonyi@edusmart.ac.ke,transport_team,NTSA/PSV-9120,School Bus Route 4 Driver,+254744556677,Fleet & Transport,4,Dove
Coach Victor Wanyama,v.wanyama@edusmart.ac.ke,cocurricular_team,TSC/SP-40291,Head Athletics & Swimming Coach,+254755667788,Sports & Activities,4,Dove`;

const UNIVERSAL_TEMPLATE_CSV = `role,admission_number,full_name,grade,stream,gender,email,phone,tsc_or_id_number,designation,parent_name,parent_phone,parent_email
student,ADM/2026/0601,Daniel Kipkemboi,4,Dove,Male,,,,Grace Kipkemboi,+254711000999,grace.k@gmail.com
student,ADM/2026/0602,Zahra Mohamed,7,Mara,Female,,,,Mohamed Ali,+254722000888,m.ali@gmail.com
teacher,,Mr. Silas Ndung'u,4,Dove,,s.ndungu@edusmart.ac.ke,+254733112233,TSC/44120/ED,Junior Science & Agriculture Teacher,,,
class_teacher,,Mrs. Lydia Muthoni,8,Tana,,l.muthoni@edusmart.ac.ke,+254744223344,TSC/55230/ED,Class Teacher Grade 8 Tana,,,`;

const DEMO_ONBOARDING_DATA = `admission_number,full_name,grade,stream,gender,parent_name,parent_phone,parent_email,special_notes
ADM/2026/0901,Trevor Kipchumba Ruto,1,Dove,Male,Hellen Ruto,+254712340001,hellen.ruto@gmail.com,None
ADM/2026/0902,Wanjiku Tracy Kamau,1,Swan,Female,James Kamau,+254723450002,james.kamau@yahoo.com,Mild dust allergy
ADM/2026/0903,Shadrack Mwenda,4,Falcon,Male,Agnes Mwenda,+254734560003,agnes.mwenda@outlook.com,Requires front bench seating
ADM/2026/0904,Halima Abdullahi,4,Flamingo,Female,Abdi Noor,+254745670004,abdi.noor@gmail.com,Special halal diet
ADM/2026/0905,Joshua Kiptoo Biwott,7,Athi,Male,Ezekiel Biwott,+254756780005,ezekiel.b@gmail.com,Junior school football player
ADM/2026/0906,Precious Achieng Okoth,7,Sabaki,Female,Lilian Okoth,+254767890006,lilian.okoth@gmail.com,Junior science club member
ADM/2026/0907,Collins Kiprotich,8,Mara,Male,Moses Kiprotich,+254778900007,moses.k@gmail.com,School band drummer
ADM/2023/0412,Brian Otieno (Re-enrolled),4,Dove,Male,Parent Otieno,+254789010008,otieno.p@gmail.com,Continuing learner profile update`;

export const BulkUserImportModule: React.FC<BulkUserImportModuleProps> = ({ 
  currentUser,
  onSuccessNotification 
}) => {
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'history' | 'templates'>('import');

  // Input mode
  const [inputMode, setInputMode] = useState<'paste' | 'file'>('paste');
  const [pastedContent, setPastedContent] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staging state
  const [stagedRows, setStagedRows] = useState<StagingRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  // Import options
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [autoCreateParents, setAutoCreateParents] = useState(true);
  const [autoEnrollLunch, setAutoEnrollLunch] = useState(true);

  // Editing in-place row
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Onboarding history
  const [batches, setBatches] = useState<OnboardingBatchRecord[]>(() => Storage.getOnboardingBatches());

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<OnboardingBatchRecord | null>(null);

  // Existing users from Storage
  const [allUsers, setAllUsers] = useState<User[]>(() => Storage.getUsers());

  // Listen to users-updated and onboarding-batches-updated
  useEffect(() => {
    const handleUsers = () => setAllUsers(Storage.getUsers());
    const handleBatches = () => setBatches(Storage.getOnboardingBatches());
    window.addEventListener('users-updated', handleUsers);
    window.addEventListener('onboarding-batches-updated', handleBatches);
    return () => {
      window.removeEventListener('users-updated', handleUsers);
      window.removeEventListener('onboarding-batches-updated', handleBatches);
    };
  }, []);

  // System Stats
  const systemStats = useMemo(() => {
    const students = allUsers.filter(u => u.role === 'student');
    const teachers = allUsers.filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));
    const parents = allUsers.filter(u => u.role === 'parent');
    const primaryCount = students.filter(s => s.grade && s.grade <= 6).length;
    const juniorCount = students.filter(s => s.grade && s.grade >= 7).length;

    return {
      totalUsers: allUsers.length,
      studentCount: students.length,
      staffCount: teachers.length,
      parentCount: parents.length,
      primaryCount,
      juniorCount
    };
  }, [allUsers]);

  // Copy template helper
  const handleCopyTemplate = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(label);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  // Download template helper
  const handleDownloadTemplate = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1-Click Load Term Opening Demo Batch
  const handleLoadDemoBatch = () => {
    setPastedContent(DEMO_ONBOARDING_DATA);
    setInputMode('paste');
    setSelectedFileName('demo_term1_onboarding_batch.csv');
    parseAndValidateRaw(DEMO_ONBOARDING_DATA, 'demo_term1_onboarding_batch.csv');
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setPastedContent(content);
        parseAndValidateRaw(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Intelligent parser & normalizer
  const parseAndValidateRaw = (rawText: string, sourceName?: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const lines = rawText
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l.length > 0);

        if (lines.length < 2) {
          setStagedRows([]);
          setIsProcessing(false);
          return;
        }

        // Determine separator: comma or tab
        const headerLine = lines[0];
        const isTab = headerLine.includes('\t');
        const separator = isTab ? '\t' : ',';

        // Split with handling of quoted values
        const splitRow = (rowStr: string): string[] => {
          if (isTab) return rowStr.split('\t').map(s => s.trim().replace(/^["']|["']$/g, ''));
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const matches: string[] = [];
          let match;
          while ((match = regex.exec(rowStr)) !== null) {
            if (match.index === regex.lastIndex) regex.lastIndex++;
            let val = match[1] ?? '';
            val = val.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
            matches.push(val);
          }
          if (matches.length && matches[matches.length - 1] === '') {
            matches.pop();
          }
          return matches;
        };

        const headers = splitRow(headerLine).map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));

        // Helper to find column index
        const findCol = (...synonyms: string[]): number => {
          return headers.findIndex(h => synonyms.some(s => h.includes(s.toLowerCase().replace(/[\s_-]+/g, ''))));
        };

        const colAdm = findCol('admissionnumber', 'admission', 'admno', 'adm', 'studentid', 'regno');
        const colName = findCol('fullname', 'name', 'studentname', 'learnername', 'staffname', 'teachername');
        const colGrade = findCol('gradelevel', 'grade', 'class', 'standard', 'form');
        const colStream = findCol('streamname', 'stream', 'classstream');
        const colRole = findCol('role', 'userrole', 'type', 'designationtype');
        const colEmail = findCol('email', 'staffemail', 'studentemail', 'useremail');
        const colPhone = findCol('phone', 'phonenumber', 'mobile', 'contact', 'telephone');
        const colTsc = findCol('tscnumber', 'tscoridnumber', 'tscno', 'tsc', 'idnumber', 'staffno', 'nationalid');
        const colDesignation = findCol('designation', 'jobtitle', 'title', 'position');
        const colDept = findCol('department', 'dept');
        const colParentName = findCol('parentname', 'guardianname', 'parent', 'guardian');
        const colParentPhone = findCol('parentphone', 'guardianphone', 'parentcontact');
        const colParentEmail = findCol('parentemail', 'guardianemail');
        const colGender = findCol('gender', 'sex');
        const colNotes = findCol('specialdietormedical', 'specialnotes', 'notes', 'dietarynotes', 'medical');

        const parsedRows: StagingRecord[] = [];
        const seenAdmsInBatch = new Set<string>();
        const seenEmailsInBatch = new Set<string>();

        // Build index of existing users for fast duplicate detection
        const existingByAdm = new Map<string, User>();
        const existingByEmail = new Map<string, User>();
        allUsers.forEach(u => {
          if (u.admissionNumber) existingByAdm.set(u.admissionNumber.toLowerCase(), u);
          if (u.email) existingByEmail.set(u.email.toLowerCase(), u);
        });

        for (let i = 1; i < lines.length; i++) {
          const cells = splitRow(lines[i]);
          if (cells.every(c => !c)) continue; // skip blank row

          const getVal = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx] : '');

          const name = getVal(colName);
          const rawAdm = getVal(colAdm);
          const rawGrade = getVal(colGrade);
          const rawStream = getVal(colStream);
          const rawRole = getVal(colRole);
          const rawEmail = getVal(colEmail);
          const phone = getVal(colPhone);
          const tscNumber = getVal(colTsc);
          const designation = getVal(colDesignation);
          const department = getVal(colDept);
          const parentName = getVal(colParentName);
          const parentPhone = getVal(colParentPhone);
          const parentEmail = getVal(colParentEmail);
          const rawGender = getVal(colGender);
          const specialNotes = getVal(colNotes);

          // Infer Role
          let role: UserRole = 'student';
          if (rawRole) {
            const cleanRole = rawRole.toLowerCase().trim();
            if (['student', 'learner'].includes(cleanRole)) role = 'student';
            else if (['class_teacher', 'classteacher'].includes(cleanRole)) role = 'class_teacher';
            else if (['teacher', 'tutor'].includes(cleanRole)) role = 'teacher';
            else if (['parent', 'guardian'].includes(cleanRole)) role = 'parent';
            else if (['nurse'].includes(cleanRole)) role = 'nurse';
            else if (['transport_team', 'transport', 'driver'].includes(cleanRole)) role = 'transport_team';
            else if (['cocurricular_team', 'cocurricular', 'coach'].includes(cleanRole)) role = 'cocurricular_team';
            else if (['hod'].includes(cleanRole)) role = 'hod';
            else if (['senior_teacher', 'seniorteacher'].includes(cleanRole)) role = 'senior_teacher';
            else if (['librarian'].includes(cleanRole)) role = 'librarian';
            else if (['school_admin_staff', 'admin_staff', 'registrar'].includes(cleanRole)) role = 'school_admin_staff';
            else role = 'teacher';
          } else {
            // If no role column, if adm or grade is provided -> student, else if tsc or designation -> teacher
            if (rawAdm || rawGrade) role = 'student';
            else if (tscNumber || designation) role = 'teacher';
            else role = 'student';
          }

          // Parse Grade (1-9)
          let grade: GradeLevel | undefined = undefined;
          if (rawGrade) {
            const num = parseInt(rawGrade.replace(/[^0-9]/g, ''), 10);
            if (num >= 1 && num <= 9) {
              grade = num as GradeLevel;
            }
          }

          // Parse & Match Stream
          let stream: StreamName | undefined = undefined;
          if (rawStream) {
            const cleanStream = rawStream.trim();
            const allValidStreams = [...PRIMARY_STREAMS, ...JUNIOR_STREAMS];
            const matched = allValidStreams.find(s => s.toLowerCase() === cleanStream.toLowerCase());
            if (matched) {
              stream = matched;
            }
          }

          // Parse Gender
          let gender: 'Male' | 'Female' | 'Other' | undefined = undefined;
          if (rawGender) {
            const g = rawGender.toLowerCase();
            if (g.startsWith('m')) gender = 'Male';
            else if (g.startsWith('f')) gender = 'Female';
            else gender = 'Other';
          }

          // Generate or format Admission Number
          let admissionNumber = rawAdm;
          if (!admissionNumber && role === 'student') {
            // Suggest an admission number
            admissionNumber = `ADM/2026/${String(100 + i).padStart(4, '0')}`;
          }

          // Email generation if empty
          let email = rawEmail;
          if (!email) {
            if (name) {
              const cleanParts = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
              const p1 = cleanParts[0] || 'user';
              const p2 = cleanParts[cleanParts.length - 1] || 'learner';
              if (role === 'student') {
                email = `${p1}.${p2}@student.edusmart.ac.ke`;
              } else {
                email = `${p1}.${p2}@edusmart.ac.ke`;
              }
            } else {
              email = `user${i}@edusmart.ac.ke`;
            }
          }

          // Validation & Diagnostic Engine
          const messages: string[] = [];
          let status: 'valid' | 'warning' | 'error' = 'valid';
          let isExistingMatch = false;

          if (!name || name.trim().length < 2) {
            messages.push('Missing or invalid full name');
            status = 'error';
          }

          if (role === 'student') {
            if (!grade) {
              messages.push('Grade must be between 1 and 9 (CBC Primary or Junior School)');
              status = 'error';
            }

            if (!stream) {
              messages.push('Invalid or missing stream name');
              status = 'error';
            } else if (grade) {
              // Check primary vs junior stream alignment
              const validStreamsForGrade = getStreamsForGrade(grade);
              if (!validStreamsForGrade.includes(stream)) {
                if (grade <= 6) {
                  messages.push(`"${stream}" is a Junior School stream (Grades 7-9). Grade ${grade} requires Primary streams (${PRIMARY_STREAMS.slice(0, 4).join(', ')}...)`);
                  status = 'error';
                } else {
                  messages.push(`"${stream}" is a Primary stream (Grades 1-6). Grade ${grade} requires Junior streams (${JUNIOR_STREAMS.slice(0, 4).join(', ')}...)`);
                  status = 'error';
                }
              }
            }
          }

          // Duplicate checks against database
          if (admissionNumber && existingByAdm.has(admissionNumber.toLowerCase())) {
            const match = existingByAdm.get(admissionNumber.toLowerCase())!;
            messages.push(`Existing learner record found with Adm No "${admissionNumber}" (${match.name})`);
            if (status !== 'error') status = 'warning';
            isExistingMatch = true;
          }

          if (email && existingByEmail.has(email.toLowerCase())) {
            const match = existingByEmail.get(email.toLowerCase())!;
            messages.push(`Email "${email}" already registered to ${match.name}`);
            if (status !== 'error') status = 'warning';
            isExistingMatch = true;
          }

          // Check duplicates within batch
          if (admissionNumber && seenAdmsInBatch.has(admissionNumber.toLowerCase())) {
            messages.push(`Duplicate Admission Number "${admissionNumber}" repeated inside this import file`);
            status = 'error';
          }
          if (admissionNumber) seenAdmsInBatch.add(admissionNumber.toLowerCase());

          if (email && seenEmailsInBatch.has(email.toLowerCase())) {
            messages.push(`Duplicate Email "${email}" repeated inside this import file`);
            status = 'error';
          }
          if (email) seenEmailsInBatch.add(email.toLowerCase());

          parsedRows.push({
            id: `stage-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            selected: status !== 'error',
            name,
            role,
            grade,
            stream,
            admissionNumber,
            email,
            phone,
            tscNumber,
            designation,
            department,
            parentName,
            parentPhone,
            parentEmail,
            gender,
            specialNotes,
            status,
            validationMessages: messages,
            isExistingMatch
          });
        }

        setStagedRows(parsedRows);
        if (onSuccessNotification) {
          onSuccessNotification(`Successfully parsed ${parsedRows.length} records. Review staging table below.`);
        }
      } catch (err) {
        console.error('Error parsing import data:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  // Toggle row selection
  const handleToggleRow = (id: string) => {
    setStagedRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  // Toggle select all
  const handleToggleSelectAll = (select: boolean) => {
    setStagedRows(prev => prev.map(r => r.status === 'error' ? { ...r, selected: false } : { ...r, selected: select }));
  };

  // Remove row from staging
  const handleDeleteRow = (id: string) => {
    setStagedRows(prev => prev.filter(r => r.id !== id));
  };

  // Quick edit row field in-place
  const handleUpdateRowField = (id: string, field: keyof StagingRecord, val: any) => {
    setStagedRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: val };

      // Re-evaluate stream if grade changed
      if (field === 'grade' && updated.grade) {
        const validStreams = getStreamsForGrade(updated.grade);
        if (updated.stream && !validStreams.includes(updated.stream)) {
          updated.stream = validStreams[0];
        }
      }

      // Re-validate row
      const msgs: string[] = [];
      let newStatus: 'valid' | 'warning' | 'error' = 'valid';

      if (!updated.name.trim()) {
        msgs.push('Name is required');
        newStatus = 'error';
      }
      if (updated.role === 'student') {
        if (!updated.grade) {
          msgs.push('Grade is required (1-9)');
          newStatus = 'error';
        }
        if (!updated.stream) {
          msgs.push('Stream is required');
          newStatus = 'error';
        } else if (updated.grade) {
          const validStreams = getStreamsForGrade(updated.grade);
          if (!validStreams.includes(updated.stream)) {
            msgs.push(`Stream ${updated.stream} not valid for Grade ${updated.grade}`);
            newStatus = 'error';
          }
        }
      }

      if (updated.isExistingMatch && newStatus !== 'error') {
        newStatus = 'warning';
        msgs.push('Existing user record matched in database');
      }

      return {
        ...updated,
        status: newStatus,
        validationMessages: msgs,
        selected: newStatus !== 'error' ? updated.selected : false
      };
    }));
  };

  // Filtered staged rows
  const filteredStagedRows = useMemo(() => {
    return stagedRows.filter(r => {
      const matchStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'valid' ? r.status === 'valid' :
        filterStatus === 'warning' ? r.status === 'warning' :
        r.status === 'error';

      const matchSearch = 
        !searchQuery.trim() ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.admissionNumber && r.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.stream && r.stream.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.parentName && r.parentName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStatus && matchSearch;
    });
  }, [stagedRows, filterStatus, searchQuery]);

  // Staging metrics
  const stagingMetrics = useMemo(() => {
    const total = stagedRows.length;
    const selected = stagedRows.filter(r => r.selected).length;
    const valid = stagedRows.filter(r => r.status === 'valid').length;
    const warnings = stagedRows.filter(r => r.status === 'warning').length;
    const errors = stagedRows.filter(r => r.status === 'error').length;
    const studentCount = stagedRows.filter(r => r.selected && r.role === 'student').length;
    const staffCount = stagedRows.filter(r => r.selected && r.role !== 'student').length;

    return { total, selected, valid, warnings, errors, studentCount, staffCount };
  }, [stagedRows]);

  // Execute Bulk Onboarding Commit
  const handleCommitImport = () => {
    const recordsToImport = stagedRows.filter(r => r.selected);
    if (recordsToImport.length === 0) return;

    setIsProcessing(true);

    try {
      const usersToCreate: User[] = [];
      const newParentUsers: User[] = [];

      recordsToImport.forEach(r => {
        const defaultPassword = r.role === 'student' 
          ? (r.grade ? `GR${r.grade}@2026` : 'student2026') 
          : 'staff2026';

        const newUser: User = {
          id: r.id.startsWith('stage-') ? `usr-${r.role}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` : r.id,
          name: r.name.trim(),
          email: r.email.trim().toLowerCase(),
          password: defaultPassword,
          role: r.role,
          grade: r.grade,
          stream: r.stream,
          admissionNumber: r.admissionNumber?.trim(),
          phone: r.phone?.trim() || r.parentPhone?.trim(),
          parentName: r.parentName?.trim(),
          parentPhone: r.parentPhone?.trim(),
          tscNumber: r.tscNumber?.trim(),
          designation: r.designation?.trim() || (r.role === 'student' ? `Learner Grade ${r.grade} ${r.stream}` : undefined),
          department: r.department?.trim()
        };

        usersToCreate.push(newUser);

        // Auto create parent user if enabled and details exist
        if (autoCreateParents && r.role === 'student' && r.parentName && (r.parentPhone || r.parentEmail)) {
          const parentCleanEmail = r.parentEmail 
            ? r.parentEmail.toLowerCase().trim() 
            : `parent.${r.parentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@parents.edusmart.ac.ke`;

          const existingParent = allUsers.find(u => u.email.toLowerCase() === parentCleanEmail) ||
            newParentUsers.find(u => u.email.toLowerCase() === parentCleanEmail);

          if (existingParent) {
            existingParent.childrenIds = Array.from(new Set([...(existingParent.childrenIds || []), newUser.id]));
          } else {
            newParentUsers.push({
              id: `usr-parent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: r.parentName.trim(),
              email: parentCleanEmail,
              password: 'parent2026',
              role: 'parent',
              phone: r.parentPhone?.trim(),
              childrenIds: [newUser.id],
              designation: `Parent / Guardian to ${newUser.name}`
            });
          }
        }
      });

      // Commit to Storage
      const allToCommit = [...usersToCreate, ...newParentUsers];
      const result = Storage.bulkImportUsers(allToCommit, overwriteExisting);

      // Create official Audit Batch Record
      const batchRef = `ONB-2026-T1-${String(batches.length + 1).padStart(2, '0')}`;
      const newBatch: OnboardingBatchRecord = {
        id: `batch-${Date.now()}`,
        batchReference: batchRef,
        timestamp: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
        importedBy: `${currentUser.name} (Academic Registrar & Secretariat)`,
        term: 1,
        academicYear: 2026,
        totalRecords: result.imported + result.updated,
        studentCount: stagingMetrics.studentCount,
        staffCount: stagingMetrics.staffCount,
        parentCount: newParentUsers.length,
        fileName: selectedFileName || 'term_opening_onboarding_import.csv',
        status: 'Completed',
        summaryNotes: `Term 1 2026 Onboarding Batch successfully executed. ${result.imported} new records created, ${result.updated} existing records updated.`,
        recordsSample: recordsToImport.slice(0, 10).map(r => ({
          name: r.name,
          role: r.role,
          grade: r.grade,
          stream: r.stream,
          admissionNumber: r.admissionNumber
        }))
      };

      Storage.saveOnboardingBatch(newBatch);
      setBatches(Storage.getOnboardingBatches());

      // Show receipt modal
      setActiveReceipt(newBatch);

      // Clear staging
      setStagedRows([]);
      setPastedContent('');
      setSelectedFileName('');

      if (onSuccessNotification) {
        onSuccessNotification(`Onboarding complete! ${result.imported} new learners/staff onboarded, ${result.updated} updated.`);
      }
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          PORTAL HERO BANNER & ENROLMENT METRICS
          ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Term 1 2026 Admissions & Enrolment Season</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="w-7 h-7 text-emerald-400 shrink-0" />
              <span>Bulk User & Student Onboarding Centre</span>
            </h2>
            
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Standardized registrar ingestion suite to streamline term opening intake. Bulk onboard CBC primary pupils, 
              junior school scholars, teachers, and support personnel with automatic CBC stream validation, 
              linked parent profile provisioning, and official secretariat enrolment certificates.
            </p>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={handleLoadDemoBatch}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Load Term 1 Demo Batch</span>
            </button>

            <button
              onClick={() => setActiveSubTab('templates')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Standard Templates</span>
            </button>
          </div>
        </div>

        {/* Live Enrolment Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 font-medium">Total Registered Users</div>
            <div className="text-xl font-black text-white mt-0.5">{systemStats.totalUsers}</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
              <Check className="w-3 h-3" /> Live in Database
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 font-medium">Total Students Enrolled</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{systemStats.studentCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Grades 1 through 9</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 font-medium">Primary School (Gr 1-6)</div>
            <div className="text-xl font-black text-blue-400 mt-0.5">{systemStats.primaryCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">8 Primary Streams</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 font-medium">Junior School (Gr 7-9)</div>
            <div className="text-xl font-black text-purple-400 mt-0.5">{systemStats.juniorCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">7 Junior Streams</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 font-medium">Teaching & Staff</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">{systemStats.staffCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Faculty & Officers</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <div className="text-slate-400 font-medium">Onboarding Batches</div>
            <div className="text-xl font-black text-teal-400 mt-0.5">{batches.length}</div>
            <div className="text-[10px] text-slate-400 mt-1">Audit Ledger Sealed</div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SUB-NAVIGATION TABS
          ======================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('import')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'import'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Upload className="w-4 h-4 text-emerald-400" />
          <span>Ingest & Onboard Records</span>
          {stagedRows.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
              {stagedRows.length} in staging
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'templates'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Standardized Templates & Formats</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Onboarding Ledger & Batch History</span>
          <span className="ml-1 text-[10px] text-slate-400 font-mono">({batches.length})</span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: INGESTION & ONBOARDING WORKBENCH
          ======================================================== */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">

          {/* INPUT METHOD CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>Step 1: Upload or Paste Term Opening Records</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accepts CSV, TSV (direct paste from Microsoft Excel or Google Sheets), or text roster formats.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setInputMode('paste')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    inputMode === 'paste' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste from Excel / Sheets
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    inputMode === 'file' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload CSV File
                </button>
              </div>
            </div>

            {/* Input Mode: Paste */}
            {inputMode === 'paste' && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={7}
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder={`Paste CSV data or copy directly from Excel / Google Sheets rows here...

Example:
admission_number,full_name,grade,stream,gender,parent_name,parent_phone,parent_email,special_notes
ADM/2026/0501,Faith Wangari Nduta,4,Dove,Female,Grace Nduta,+254712000111,grace.nduta@gmail.com,Asthma inhaler in bag
ADM/2026/0502,Brian Kiprono Koech,4,Eagle,Male,David Koech,+254722000222,david.koech@gmail.com,None
ADM/2026/0503,Amina Fatuma Hassan,7,Mara,Female,Hassan Omar,+254733000333,hassan.omar@gmail.com,Halal meal preference`}
                    className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  />
                  {pastedContent && (
                    <button
                      onClick={() => setPastedContent('')}
                      className="absolute top-3 right-3 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded font-sans transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Headers are automatically detected regardless of column order or case.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLoadDemoBatch}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Paste Demo Batch</span>
                    </button>

                    <button
                      disabled={!pastedContent.trim() || isProcessing}
                      onClick={() => parseAndValidateRaw(pastedContent, 'pasted_onboarding_data.csv')}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>Parse & Validate Staging Grid</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Mode: File Upload */}
            {inputMode === 'file' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
                >
                  <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {selectedFileName ? selectedFileName : 'Click to select CSV file from computer'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Drag and drop your Term Opening Enrolment CSV file here, or click to browse. Standard format supported.
                  </p>
                </div>

                {selectedFileName && (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-4 py-2.5 rounded-xl border border-emerald-200 text-xs">
                    <span className="font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      File ready: <strong>{selectedFileName}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFileName('');
                        setPastedContent('');
                        setStagedRows([]);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STAGING & PRE-FLIGHT VALIDATION INSPECTOR */}
          {stagedRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              
              {/* Header & Metrics */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Step 2: Pre-Flight Staging & CBC Stream Validation</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect, edit in-place, and verify student stream allocations before committing to the live registry.
                  </p>
                </div>

                {/* Staging Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                    Total: {stagingMetrics.total}
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Valid: {stagingMetrics.valid}</span>
                  </div>
                  {stagingMetrics.warnings > 0 && (
                    <div className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Warnings: {stagingMetrics.warnings}</span>
                    </div>
                  )}
                  {stagingMetrics.errors > 0 && (
                    <div className="px-3 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Errors: {stagingMetrics.errors}</span>
                    </div>
                  )}
                  <div className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                    Ready to Commit: {stagingMetrics.selected}
                  </div>
                </div>
              </div>

              {/* Filters & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                
                {/* Search & Status Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search staging records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 sm:w-60 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg font-medium">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        filterStatus === 'all' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      All ({stagingMetrics.total})
                    </button>
                    <button
                      onClick={() => setFilterStatus('valid')}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        filterStatus === 'valid' ? 'bg-white font-bold text-emerald-800 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Valid ({stagingMetrics.valid})
                    </button>
                    {stagingMetrics.warnings > 0 && (
                      <button
                        onClick={() => setFilterStatus('warning')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          filterStatus === 'warning' ? 'bg-white font-bold text-amber-800 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Warnings ({stagingMetrics.warnings})
                      </button>
                    )}
                    {stagingMetrics.errors > 0 && (
                      <button
                        onClick={() => setFilterStatus('error')}
                        className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          filterStatus === 'error' ? 'bg-white font-bold text-rose-800 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Errors ({stagingMetrics.errors})
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Selection Helpers */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
                  >
                    Select All Valid
                  </button>
                  <button
                    onClick={() => handleToggleSelectAll(false)}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Data Grid Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={stagingMetrics.selected === stagingMetrics.total && stagingMetrics.total > 0}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded text-indigo-600 cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Full Name</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Adm / TSC No</th>
                      <th className="py-3 px-3">Grade & Stream</th>
                      <th className="py-3 px-3">Parent Contact / Guardian</th>
                      <th className="py-3 px-3">Account Email</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStagedRows.map((row) => {
                      const isEditing = editingRowId === row.id;

                      return (
                        <tr 
                          key={row.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !row.selected ? 'opacity-60 bg-slate-50/40' : ''
                          } ${
                            row.status === 'error' ? 'bg-rose-50/30' : 
                            row.status === 'warning' ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              disabled={row.status === 'error'}
                              onChange={() => handleToggleRow(row.id)}
                              className="rounded text-indigo-600 cursor-pointer"
                            />
                          </td>

                          {/* Status Badge & Diagnostic Popover */}
                          <td className="py-3 px-3">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {row.status === 'warning' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  <AlertTriangle className="w-3 h-3" /> Existing
                                </span>
                                <div className="text-[10px] text-amber-700 max-w-xs truncate">
                                  {row.validationMessages[0]}
                                </div>
                              </div>
                            )}
                            {row.status === 'error' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                                <div className="text-[10px] text-rose-700 font-medium">
                                  {row.validationMessages.join(' · ')}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Full Name */}
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleUpdateRowField(row.id, 'name', e.target.value)}
                                className="w-full p-1 border rounded text-xs bg-white"
                              />
                            ) : (
                              <div>
                                <span>{row.name}</span>
                                {row.gender && (
                                  <span className="ml-1 text-[10px] text-slate-400">({row.gender})</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <select
                                value={row.role}
                                onChange={(e) => handleUpdateRowField(row.id, 'role', e.target.value as UserRole)}
                                className="p-1 border rounded text-xs bg-white"
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="class_teacher">Class Teacher</option>
                                <option value="parent">Parent</option>
                                <option value="nurse">Nurse</option>
                                <option value="transport_team">Transport</option>
                                <option value="cocurricular_team">Co-Curricular</option>
                                <option value="hod">HOD</option>
                                <option value="senior_teacher">Senior Teacher</option>
                                <option value="librarian">Librarian</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                row.role === 'student' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                row.role === 'teacher' || row.role === 'class_teacher' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                {row.role.replace('_', ' ')}
                              </span>
                            )}
                          </td>

                          {/* Adm No / TSC No */}
                          <td className="py-3 px-3 font-mono text-slate-700">
                            {isEditing ? (
                              <input
                                type="text"
                                value={row.admissionNumber || row.tscNumber || ''}
                                onChange={(e) => {
                                  if (row.role === 'student') {
                                    handleUpdateRowField(row.id, 'admissionNumber', e.target.value);
                                  } else {
                                    handleUpdateRowField(row.id, 'tscNumber', e.target.value);
                                  }
                                }}
                                className="w-full p-1 border rounded text-xs bg-white font-mono"
                              />
                            ) : (
                              row.admissionNumber || row.tscNumber || '—'
                            )}
                          </td>

                          {/* Grade & Stream (With CBC stream auto-checker) */}
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={row.grade || 4}
                                  onChange={(e) => handleUpdateRowField(row.id, 'grade', parseInt(e.target.value, 10) as GradeLevel)}
                                  className="p-1 border rounded text-xs bg-white"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                                    <option key={g} value={g}>Grade {g}</option>
                                  ))}
                                </select>

                                <select
                                  value={row.stream || 'Dove'}
                                  onChange={(e) => handleUpdateRowField(row.id, 'stream', e.target.value as StreamName)}
                                  className="p-1 border rounded text-xs bg-white"
                                >
                                  {(row.grade ? getStreamsForGrade(row.grade) : PRIMARY_STREAMS).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              row.grade ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-800">Gr {row.grade}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-mono text-slate-700 border border-slate-200">
                                    {row.stream}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )
                            )}
                          </td>

                          {/* Parent Details */}
                          <td className="py-3 px-3 text-slate-600">
                            {row.parentName ? (
                              <div>
                                <div className="font-medium text-slate-800">{row.parentName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{row.parentPhone || row.parentEmail || 'No contact'}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Account Email */}
                          <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={row.email}
                                onChange={(e) => handleUpdateRowField(row.id, 'email', e.target.value)}
                                className="w-full p-1 border rounded text-xs bg-white font-mono"
                              />
                            ) : (
                              <span className="truncate max-w-[150px] inline-block">{row.email}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <button
                                  onClick={() => setEditingRowId(null)}
                                  className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 rounded cursor-pointer"
                                  title="Done editing"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingRowId(row.id)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded cursor-pointer"
                                  title="Edit row"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ========================================================
                  STEP 3: CONFIGURATION & COMMIT CONTROLS
                  ======================================================== */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>Step 3: Onboarding Automation Options & Enrolment Execution</span>
                  </h4>
                  <div className="text-xs text-slate-500 font-mono">
                    Registrar Session: Term 1 2026
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-800">Update Existing Records</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        If admission number or email exists, update their grade, stream, and contacts.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={autoCreateParents}
                      onChange={(e) => setAutoCreateParents(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-800">Auto-Provision Parent Accounts</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Creates linked parent portal credentials with access to their children's progress.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={autoEnrollLunch}
                      onChange={(e) => setAutoEnrollLunch(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-slate-800">Learner Lunch Register Enrollment</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Enrolls learners into the Term 1 dining roll with specified dietary notes.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Final Execution Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-600">
                    Ready to commit <strong>{stagingMetrics.selected}</strong> verified records ({stagingMetrics.studentCount} students, {stagingMetrics.staffCount} staff).
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setStagedRows([]);
                        setPastedContent('');
                        setSelectedFileName('');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Discard Staging
                    </button>

                    <button
                      disabled={stagingMetrics.selected === 0 || isProcessing}
                      onClick={handleCommitImport}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>Commit & Finalize Term Onboarding ({stagingMetrics.selected})</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: STANDARDIZED TEMPLATES & SPECIFICATIONS
          ======================================================== */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>EduSmart Gadsa Standardized Enrolment Templates</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Download these standardized CSV templates to distribute to class teachers, admissions clerks, or departmental 
                secretaries. Data filled into these formats will upload seamlessly into the EduSmart system.
              </p>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Template 1: Student Intake */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl w-fit">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">1. Student Intake Template</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Designed for Term 1 opening pupil admissions. Includes columns for Admission Number, Full Name, Grade Level (1-9), CBC Stream, Parent contacts, and Dietary notes.
                  </p>
                  <div className="text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 truncate">
                    admission_number,full_name,grade,stream,gender,parent_name...
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleDownloadTemplate(STUDENT_TEMPLATE_CSV, 'edusmart_student_import_template.csv')}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(STUDENT_TEMPLATE_CSV, 'student')}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Copy CSV to clipboard"
                  >
                    {copiedTemplate === 'student' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Template 2: Staff & Teachers Deployment */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl w-fit">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">2. Staff Deployment Template</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Designed for faculty, class teachers, nursing staff, bus drivers, and activity coaches. Includes TSC Number, Designation, Phone, and Department.
                  </p>
                  <div className="text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 truncate">
                    full_name,email,role,tsc_or_id_number,designation,phone...
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleDownloadTemplate(STAFF_TEMPLATE_CSV, 'edusmart_staff_import_template.csv')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(STAFF_TEMPLATE_CSV, 'staff')}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Copy CSV to clipboard"
                  >
                    {copiedTemplate === 'staff' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Template 3: Universal All-in-One Template */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl w-fit">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">3. Universal Master Template</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Combined multi-role format suitable for full school migrations or entire campus onboarding. Automatically segments students, teachers, and staff.
                  </p>
                  <div className="text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 truncate">
                    role,admission_number,full_name,grade,stream,gender...
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleDownloadTemplate(UNIVERSAL_TEMPLATE_CSV, 'edusmart_universal_import_template.csv')}
                    className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(UNIVERSAL_TEMPLATE_CSV, 'universal')}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Copy CSV to clipboard"
                  >
                    {copiedTemplate === 'universal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Allowed Values Reference Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>CBC System Rules & Allowed Values Reference</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="font-bold text-slate-200">1. Primary School Streams (Grades 1 - 6):</div>
                  <div className="text-slate-400 font-mono text-[11px] leading-relaxed">
                    {PRIMARY_STREAMS.join(', ')}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-200">2. Junior School Streams (Grades 7 - 9):</div>
                  <div className="text-slate-400 font-mono text-[11px] leading-relaxed">
                    {JUNIOR_STREAMS.join(', ')}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-200">3. Supported Roles:</div>
                  <div className="text-slate-400 font-mono text-[11px] leading-relaxed">
                    student, teacher, class_teacher, parent, nurse, transport_team, cocurricular_team, hod, senior_teacher, librarian
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: ONBOARDING LEDGER & AUDIT HISTORY
          ======================================================== */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Term Opening Enrolment & Onboarding Audit Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent secretariat record of all executed bulk user imports, student batches, and certificates.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                {batches.length} Registered Batches
              </div>
            </div>

            {batches.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No onboarding batches recorded yet</p>
                <p className="text-xs">Execute an onboarding batch in the Ingest workbench to create an audit record.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="py-3 px-3">Batch Reference</th>
                      <th className="py-3 px-3">Date & Timestamp</th>
                      <th className="py-3 px-3">Registrar / Officer</th>
                      <th className="py-3 px-3 text-center">Students</th>
                      <th className="py-3 px-3 text-center">Staff</th>
                      <th className="py-3 px-3 text-center">Total Ingested</th>
                      <th className="py-3 px-3">Source File</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                          {b.batchReference}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">
                          {b.timestamp}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {b.importedBy}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-600">
                          {b.studentCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">
                          {b.staffCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {b.totalRecords}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                          {b.fileName || 'CSV Ingestion'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setActiveReceipt(b)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SECRETARIAT ONBOARDING AUDIT RECEIPT MODAL
          ======================================================== */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Title Bar */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <EduSmartGadsaLogo variant="emblem" size="sm" />
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Official Term Opening Enrolment Certificate</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                      Sealed
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ref: {activeReceipt.batchReference} · Term {activeReceipt.term} {activeReceipt.academicYear}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Certificate Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
              
              {/* Institutional Crest & Seal */}
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <div className="flex justify-center mb-2">
                  <EduSmartGadsaLogo variant="horizontal" size="md" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  EduSmart Gadsa Academy · Registrar Secretariat
                </div>
                <div className="text-sm font-black text-slate-900">
                  CERTIFICATE OF OFFICIAL ONBOARDING & ENROLMENT
                </div>
                <div className="text-[11px] text-slate-500">
                  Issued under the authority of the Senior Administrative Officer & Academic Registrar
                </div>
              </div>

              {/* Certificate Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Batch Reference</div>
                  <div className="font-mono font-bold text-indigo-700">{activeReceipt.batchReference}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Execution Date</div>
                  <div className="font-semibold text-slate-800">{activeReceipt.timestamp}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Term & Year</div>
                  <div className="font-semibold text-slate-800">Term {activeReceipt.term} {activeReceipt.academicYear}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Audit Status</div>
                  <div className="font-bold text-emerald-700">{activeReceipt.status}</div>
                </div>
              </div>

              {/* Statistics Breakdown */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Enrolment Summary Statistics</span>
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <div className="text-xs text-blue-700 font-medium">New Learners</div>
                    <div className="text-xl font-black text-blue-900 mt-0.5">{activeReceipt.studentCount}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <div className="text-xs text-emerald-700 font-medium">Staff & Faculty</div>
                    <div className="text-xl font-black text-emerald-900 mt-0.5">{activeReceipt.staffCount}</div>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                    <div className="text-xs text-purple-700 font-medium">Linked Parents</div>
                    <div className="text-xl font-black text-purple-900 mt-0.5">{activeReceipt.parentCount}</div>
                  </div>
                </div>
              </div>

              {/* Sample Records Roster */}
              {activeReceipt.recordsSample && activeReceipt.recordsSample.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900">Sample Records Included in this Onboarding Batch:</h5>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-[11px]">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3">Adm / TSC</th>
                          <th className="py-2 px-3">Grade & Stream</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeReceipt.recordsSample.map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{rec.name}</td>
                            <td className="py-2 px-3 capitalize text-slate-600">{rec.role.replace('_', ' ')}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{rec.admissionNumber || '—'}</td>
                            <td className="py-2 px-3">
                              {rec.grade ? `Gr ${rec.grade} ${rec.stream || ''}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Registrar Signature Block */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{activeReceipt.importedBy}</div>
                  <div className="text-[11px] text-slate-500">School Administration Secretariat</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] text-emerald-700 font-bold flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>DIGITALLY VERIFIED</span>
                  </div>
                  <div className="text-[10px] text-slate-400">EduSmart Gadsa CBC Database</div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Certificate</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
