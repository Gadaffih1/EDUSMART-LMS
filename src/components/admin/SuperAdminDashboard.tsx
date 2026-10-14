import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  School, 
  Palette, 
  Users, 
  Bell, 
  SpellCheck, 
  FolderPlus, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Sparkles, 
  Globe, 
  Building2, 
  UserCheck, 
  UserX, 
  Send, 
  RefreshCw, 
  Layers, 
  Upload, 
  Eye, 
  Save, 
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Shield,
  Award,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  Sliders,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { User, UserRole, GradeLevel, StreamName, AppNotification, PostCategory } from '../../types';
import { Tenant } from '../../types/tenant';
import { useTenant } from '../../context/TenantContext';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface SuperAdminDashboardProps {
  currentUser: User;
  onNavigateTab?: (tab: string) => void;
}

type SuperTab = 'schools' | 'branding' | 'users' | 'categories' | 'spelling' | 'notify';

// Built-in common spelling dictionary for Kenyan CBC education system
const COMMON_SPELLING_DICTIONARY: { typo: string; correction: string; context: string }[] = [
  { typo: 'mathemetics', correction: 'mathematics', context: 'Subjects / Departments' },
  { typo: 'sciense', correction: 'science', context: 'Subjects / Departments' },
  { typo: 'englsih', correction: 'english', context: 'Subjects' },
  { typo: 'kiswahiil', correction: 'kiswahili', context: 'Subjects' },
  { typo: 'agriculcher', correction: 'agriculture', context: 'Subjects / Projects' },
  { typo: 'geografy', correction: 'geography', context: 'Subjects' },
  { typo: 'curiculum', correction: 'curriculum', context: 'Governance / Academics' },
  { typo: 'prinsipal', correction: 'principal', context: 'Designations / Titles' },
  { typo: 'regstrar', correction: 'registrar', context: 'Admin Staff' },
  { typo: 'librian', correction: 'librarian', context: 'Library Staff' },
  { typo: 'coordnator', correction: 'coordinator', context: 'Leadership' },
  { typo: 'sanitorium', correction: 'sanatorium', context: 'Medical Clinic' },
  { typo: 'st. austins', correction: "St. Austin's", context: 'School Names' },
  { typo: 'riara spring', correction: 'Riara Springs', context: 'School Names' },
  { typo: 'academiks', correction: 'academics', context: 'Categories' }
];

// Preset background color palettes for school branding
const BG_PALETTES = [
  { name: 'Crisp Alabaster (Default)', hex: '#f8fafc', textColor: 'text-slate-900', border: 'border-slate-300' },
  { name: 'Soft Mint Green', hex: '#f0fdf4', textColor: 'text-emerald-950', border: 'border-emerald-300' },
  { name: 'Soft Ice Blue', hex: '#f0f9ff', textColor: 'text-sky-950', border: 'border-sky-300' },
  { name: 'Lavender Royal', hex: '#f5f3ff', textColor: 'text-purple-950', border: 'border-purple-300' },
  { name: 'Warm Desert Sand', hex: '#fffbeb', textColor: 'text-amber-950', border: 'border-amber-300' },
  { name: 'Soft Rose Quartz', hex: '#fff1f2', textColor: 'text-rose-950', border: 'border-rose-300' },
  { name: 'Emerald Forest Dark', hex: '#064e3b', textColor: 'text-white', border: 'border-emerald-700' },
  { name: 'Royal Indigo Night', hex: '#1e1b4b', textColor: 'text-white', border: 'border-indigo-700' },
  { name: 'Midnight Deep Slate', hex: '#0f172a', textColor: 'text-white', border: 'border-slate-700' },
  { name: 'Onyx Executive', hex: '#18181b', textColor: 'text-white', border: 'border-zinc-700' },
];

// Header background gradients
const HEADER_GRADIENTS = [
  { label: 'Emerald Deep', class: 'from-emerald-900 via-slate-900 to-emerald-950' },
  { label: 'Ocean Royal Blue', class: 'from-blue-900 via-slate-900 to-indigo-950' },
  { label: 'Indigo Purple', class: 'from-indigo-900 via-slate-900 to-purple-950' },
  { label: 'Amber Teracotta', class: 'from-amber-950 via-slate-900 to-orange-950' },
  { label: 'Crimson Rose', class: 'from-rose-950 via-slate-900 to-pink-950' },
  { label: 'Onyx Monochrome', class: 'from-slate-900 via-zinc-900 to-black' },
];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  onNavigateTab
}) => {
  const { currentTenant, allTenants, switchTenant, updateTenantBranding, registerTenant, updateTenant, deleteTenant } = useTenant();

  // Active top-level subtab within Super Admin Command Hub
  const [activeSubTab, setActiveSubTab] = useState<SuperTab>('schools');

  // Selected school to configure (defaults to current tenant)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentTenant.id);

  // Users state with live event sync
  const [users, setUsers] = useState<User[]>(() => Storage.getUsers());
  useEffect(() => {
    const handleUsersUpdated = () => setUsers(Storage.getUsers());
    window.addEventListener('users-updated', handleUsersUpdated);
    return () => window.removeEventListener('users-updated', handleUsersUpdated);
  }, []);

  // Categories state with live sync
  const [categories, setCategories] = useState<PostCategory[]>(() => Storage.getPostCategories());
  useEffect(() => {
    const handleCatsUpdated = () => setCategories(Storage.getPostCategories());
    window.addEventListener('post-categories-updated', handleCatsUpdated);
    return () => window.removeEventListener('post-categories-updated', handleCatsUpdated);
  }, []);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => Storage.getNotifications());
  useEffect(() => {
    const handleNotifs = () => setNotifications(Storage.getNotifications());
    window.addEventListener('notifications-updated', handleNotifs);
    return () => window.removeEventListener('notifications-updated', handleNotifs);
  }, []);

  const targetSchool = useMemo(() => {
    return allTenants.find(t => t.id === selectedSchoolId) || currentTenant;
  }, [allTenants, selectedSchoolId, currentTenant]);

  // Success / Alert message toast
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // ========================================================
  // 1. REGISTER SCHOOL MODAL & EDIT STATE
  // ========================================================
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    shortName: '',
    motto: '',
    code: '',
    registrationNumber: '',
    curriculum: 'Kenyan CBC Curriculum (Grades 1-9)',
    address: '',
    city: 'Nairobi',
    county: 'Nairobi County',
    phone: '',
    email: '',
    principalName: '',
    principalTitle: 'Head of Institution & Principal',
    establishedYear: 2020,
    crestIcon: 'graduation-cap' as 'school' | 'graduation-cap' | 'book-open' | 'shield',
    themeColor: 'emerald',
    backgroundColor: '#f8fafc',
    headerBgClass: 'from-emerald-900 via-slate-900 to-emerald-950',
    totalStudents: 450,
    totalFaculty: 32,
    categories: ['Science & STEM', 'Creative Arts', 'Sports & Athletics']
  });

  const handleOpenNewSchoolModal = () => {
    setEditingSchoolId(null);
    setSchoolForm({
      name: '',
      shortName: '',
      motto: 'Excellence in Scholarship & Character',
      code: `SCH-${Math.floor(100 + Math.random() * 900)}`,
      registrationNumber: `MOE/PRI-JSS/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      curriculum: 'Kenyan CBC Curriculum (Grades 1-9)',
      address: '',
      city: 'Nairobi',
      county: 'Nairobi County',
      phone: '+254 700 000 000',
      email: 'admissions@school.edusmart.ac.ke',
      principalName: 'Dr. Jane Mwangi, PhD',
      principalTitle: 'Head of Institution & Principal',
      establishedYear: new Date().getFullYear(),
      crestIcon: 'graduation-cap',
      themeColor: 'emerald',
      backgroundColor: '#f8fafc',
      headerBgClass: 'from-emerald-900 via-slate-900 to-emerald-950',
      totalStudents: 350,
      totalFaculty: 25,
      categories: ['Science & STEM', 'Creative Arts', 'Sports & Athletics']
    });
    setShowSchoolModal(true);
  };

  const handleOpenEditSchoolModal = (school: Tenant) => {
    setEditingSchoolId(school.id);
    setSchoolForm({
      name: school.name,
      shortName: school.shortName,
      motto: school.motto,
      code: school.code,
      registrationNumber: school.registrationNumber,
      curriculum: school.curriculum,
      address: school.address,
      city: school.city,
      county: school.county,
      phone: school.phone,
      email: school.email,
      principalName: school.principalName,
      principalTitle: school.principalTitle,
      establishedYear: school.establishedYear,
      crestIcon: school.crestIcon,
      themeColor: school.themeColor,
      backgroundColor: school.backgroundColor || '#f8fafc',
      headerBgClass: school.headerBgClass || 'from-emerald-900 via-slate-900 to-emerald-950',
      totalStudents: school.totalStudents,
      totalFaculty: school.totalFaculty,
      categories: school.categories || ['Science & STEM', 'Creative Arts']
    });
    setShowSchoolModal(true);
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim() || !schoolForm.code.trim()) {
      showToast('School name and registration code are required.', 'error');
      return;
    }

    if (editingSchoolId) {
      updateTenant(editingSchoolId, {
        name: schoolForm.name,
        shortName: schoolForm.shortName || schoolForm.name.split(' ')[0],
        motto: schoolForm.motto,
        code: schoolForm.code,
        registrationNumber: schoolForm.registrationNumber,
        curriculum: schoolForm.curriculum,
        address: schoolForm.address,
        city: schoolForm.city,
        county: schoolForm.county,
        phone: schoolForm.phone,
        email: schoolForm.email,
        principalName: schoolForm.principalName,
        principalTitle: schoolForm.principalTitle,
        establishedYear: Number(schoolForm.establishedYear),
        crestIcon: schoolForm.crestIcon,
        themeColor: schoolForm.themeColor,
        backgroundColor: schoolForm.backgroundColor,
        headerBgClass: schoolForm.headerBgClass,
        totalStudents: Number(schoolForm.totalStudents),
        totalFaculty: Number(schoolForm.totalFaculty),
        categories: schoolForm.categories
      });
      showToast(`Updated details for "${schoolForm.name}".`);
    } else {
      const newId = `tenant-${schoolForm.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}-${Date.now()}`;
      const newTenant: Tenant = {
        id: newId,
        name: schoolForm.name,
        shortName: schoolForm.shortName || schoolForm.name.split(' ')[0],
        motto: schoolForm.motto,
        code: schoolForm.code,
        registrationNumber: schoolForm.registrationNumber,
        curriculum: schoolForm.curriculum,
        domain: `${schoolForm.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.edusmart.ac.ke`,
        address: schoolForm.address || 'School Road',
        city: schoolForm.city,
        county: schoolForm.county,
        phone: schoolForm.phone,
        email: schoolForm.email,
        principalName: schoolForm.principalName,
        principalTitle: schoolForm.principalTitle,
        establishedYear: Number(schoolForm.establishedYear),
        gradeLevels: 'Grade 1 through Grade 9 CBC',
        term: 'Term 1, 2026',
        academicYear: '2026 Academic Year',
        totalStudents: Number(schoolForm.totalStudents),
        totalFaculty: Number(schoolForm.totalFaculty),
        crestIcon: schoolForm.crestIcon,
        themeColor: schoolForm.themeColor,
        backgroundColor: schoolForm.backgroundColor,
        headerBgClass: schoolForm.headerBgClass,
        badgeColorClass: `bg-${schoolForm.themeColor}-100 text-${schoolForm.themeColor}-800 border-${schoolForm.themeColor}-300`,
        status: 'active',
        categories: schoolForm.categories,
        registeredAt: new Date().toISOString()
      };
      registerTenant(newTenant);
      setSelectedSchoolId(newTenant.id);
      showToast(`Registered new school: "${newTenant.name}"!`);
    }
    setShowSchoolModal(false);
  };

  const handleDeleteSchool = (school: Tenant) => {
    if (confirm(`Are you sure you want to remove school "${school.name}" (${school.code}) from the multi-tenant registry?`)) {
      deleteTenant(school.id);
      showToast(`Removed school "${school.name}".`, 'info');
    }
  };

  // ========================================================
  // 2. BRANDING & BACKGROUND COLOR CUSTOMIZER
  // ========================================================
  const [customLogoUrl, setCustomLogoUrl] = useState(targetSchool.logoUrl || '');
  const [customBgColor, setCustomBgColor] = useState(targetSchool.backgroundColor || '#f8fafc');
  const [selectedHeaderGradient, setSelectedHeaderGradient] = useState(targetSchool.headerBgClass || HEADER_GRADIENTS[0].class);
  const [selectedCrest, setSelectedCrest] = useState<'school' | 'graduation-cap' | 'book-open' | 'shield'>(targetSchool.crestIcon || 'graduation-cap');

  useEffect(() => {
    setCustomLogoUrl(targetSchool.logoUrl || '');
    setCustomBgColor(targetSchool.backgroundColor || '#f8fafc');
    setSelectedHeaderGradient(targetSchool.headerBgClass || HEADER_GRADIENTS[0].class);
    setSelectedCrest(targetSchool.crestIcon || 'graduation-cap');
  }, [targetSchool]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file size exceeds 2MB limit. Please upload a smaller SVG or PNG.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
          showToast('School logo image loaded. Click "Save Branding" to apply.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = () => {
    updateTenantBranding({
      logoUrl: customLogoUrl || undefined,
      backgroundColor: customBgColor,
      headerBgClass: selectedHeaderGradient,
      crestIcon: selectedCrest
    }, targetSchool.id);
    showToast(`Branding & background color saved for "${targetSchool.name}"!`);
  };

  // ========================================================
  // 3. USER MANAGEMENT: ACTIVATE / DEACTIVATE / ADD / EDIT / REMOVE
  // ========================================================
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSchoolFilter, setUserSchoolFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher' as UserRole,
    schoolId: targetSchool.id,
    grade: 1 as GradeLevel,
    stream: 'Dove' as StreamName,
    admissionNumber: '',
    tscNumber: '',
    designation: '',
    department: '',
    isActive: true
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.admissionNumber && u.admissionNumber.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.phone && u.phone.includes(userSearch));

      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesSchool = userSchoolFilter === 'all' || (u.schoolId ? u.schoolId === userSchoolFilter : userSchoolFilter === currentTenant.id);
      
      const isUserActive = u.isActive !== false;
      const matchesStatus = 
        userStatusFilter === 'all' ? true :
        userStatusFilter === 'active' ? isUserActive :
        !isUserActive;

      return matchesSearch && matchesRole && matchesSchool && matchesStatus;
    });
  }, [users, userSearch, userRoleFilter, userSchoolFilter, userStatusFilter, currentTenant.id]);

  const handleToggleUserActivation = (user: User) => {
    const nextStatus = user.isActive === false ? true : false;
    Storage.toggleUserStatus(user.id, nextStatus);
    showToast(`Account for ${user.name} is now ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}.`, nextStatus ? 'success' : 'info');
  };

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '+254 7',
      role: 'teacher',
      schoolId: targetSchool.id,
      grade: 4,
      stream: 'Dove',
      admissionNumber: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      tscNumber: `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`,
      designation: 'Senior Faculty Member',
      department: 'Sciences & Mathematics',
      isActive: true
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      schoolId: user.schoolId || currentTenant.id,
      grade: user.grade || 1,
      stream: user.stream || 'Dove',
      admissionNumber: user.admissionNumber || '',
      tscNumber: user.tscNumber || '',
      designation: user.designation || '',
      department: user.department || '',
      isActive: user.isActive !== false
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    if (editingUserId) {
      Storage.updateUser(editingUserId, {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        schoolId: userForm.schoolId,
        grade: userForm.role === 'student' ? userForm.grade : undefined,
        stream: userForm.role === 'student' ? userForm.stream : undefined,
        admissionNumber: userForm.role === 'student' ? userForm.admissionNumber : undefined,
        tscNumber: ['teacher', 'class_teacher', 'hod', 'senior_teacher', 'deputy_head', 'head_teacher'].includes(userForm.role) ? userForm.tscNumber : undefined,
        designation: userForm.designation,
        department: userForm.department,
        isActive: userForm.isActive
      });
      showToast(`User ${userForm.name} updated successfully.`);
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: userForm.name,
        email: userForm.email.toLowerCase().trim(),
        phone: userForm.phone,
        role: userForm.role,
        schoolId: userForm.schoolId,
        grade: userForm.role === 'student' ? userForm.grade : undefined,
        stream: userForm.role === 'student' ? userForm.stream : undefined,
        admissionNumber: userForm.role === 'student' ? userForm.admissionNumber : undefined,
        tscNumber: userForm.tscNumber,
        designation: userForm.designation,
        department: userForm.department,
        isActive: userForm.isActive
      };
      Storage.addUser(newUser);
      showToast(`User ${newUser.name} created!`);
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to completely remove user ${user.name} (${user.email})? This action cannot be undone.`)) {
      Storage.deleteUser(user.id);
      showToast(`User ${user.name} removed.`, 'info');
    }
  };

  // ========================================================
  // 4. SPELLING SCANNER & MASS DATA POLISHER
  // ========================================================
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');
  const [spellingIssuesFound, setSpellingIssuesFound] = useState<{ id: string; type: 'user' | 'category' | 'school'; original: string; proposed: string; field: string; recordId: string }[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const runSpellingScan = () => {
    const issues: { id: string; type: 'user' | 'category' | 'school'; original: string; proposed: string; field: string; recordId: string }[] = [];
    
    // Scan Users
    users.forEach(u => {
      COMMON_SPELLING_DICTIONARY.forEach(dict => {
        const regex = new RegExp(`\\b${dict.typo}\\b`, 'gi');
        if (regex.test(u.name)) {
          issues.push({ id: `usr-name-${u.id}`, type: 'user', original: u.name, proposed: u.name.replace(regex, dict.correction), field: 'Full Name', recordId: u.id });
        }
        if (u.department && regex.test(u.department)) {
          issues.push({ id: `usr-dept-${u.id}`, type: 'user', original: u.department, proposed: u.department.replace(regex, dict.correction), field: 'Department', recordId: u.id });
        }
        if (u.designation && regex.test(u.designation)) {
          issues.push({ id: `usr-desig-${u.id}`, type: 'user', original: u.designation, proposed: u.designation.replace(regex, dict.correction), field: 'Designation', recordId: u.id });
        }
      });
    });

    // Scan Categories
    categories.forEach(c => {
      COMMON_SPELLING_DICTIONARY.forEach(dict => {
        const regex = new RegExp(`\\b${dict.typo}\\b`, 'gi');
        if (regex.test(c.name)) {
          issues.push({ id: `cat-name-${c.id}`, type: 'category', original: c.name, proposed: c.name.replace(regex, dict.correction), field: 'Category Name', recordId: c.id });
        }
      });
    });

    // Scan Schools
    allTenants.forEach(t => {
      COMMON_SPELLING_DICTIONARY.forEach(dict => {
        const regex = new RegExp(`\\b${dict.typo}\\b`, 'gi');
        if (regex.test(t.name)) {
          issues.push({ id: `sch-name-${t.id}`, type: 'school', original: t.name, proposed: t.name.replace(regex, dict.correction), field: 'School Name', recordId: t.id });
        }
        if (regex.test(t.motto)) {
          issues.push({ id: `sch-motto-${t.id}`, type: 'school', original: t.motto, proposed: t.motto.replace(regex, dict.correction), field: 'School Motto', recordId: t.id });
        }
      });
    });

    setSpellingIssuesFound(issues);
    setHasScanned(true);
    showToast(`Scan complete: found ${issues.length} spelling item(s).`);
  };

  const applySingleSpellingFix = (issue: typeof spellingIssuesFound[0]) => {
    if (issue.type === 'user') {
      const u = users.find(x => x.id === issue.recordId);
      if (u) {
        if (issue.field === 'Full Name') Storage.updateUser(u.id, { name: issue.proposed });
        if (issue.field === 'Department') Storage.updateUser(u.id, { department: issue.proposed });
        if (issue.field === 'Designation') Storage.updateUser(u.id, { designation: issue.proposed });
      }
    } else if (issue.type === 'category') {
      Storage.updatePostCategory(issue.recordId, { name: issue.proposed });
    } else if (issue.type === 'school') {
      if (issue.field === 'School Name') updateTenant(issue.recordId, { name: issue.proposed });
      if (issue.field === 'School Motto') updateTenant(issue.recordId, { motto: issue.proposed });
    }
    setSpellingIssuesFound(prev => prev.filter(i => i.id !== issue.id));
    showToast(`Corrected: "${issue.original}" → "${issue.proposed}"`);
  };

  const applyAllSpellingFixes = () => {
    spellingIssuesFound.forEach(issue => applySingleSpellingFix(issue));
    showToast(`Applied all ${spellingIssuesFound.length} corrections.`);
    setSpellingIssuesFound([]);
  };

  const handleGlobalFindAndReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findWord.trim() || !replaceWord.trim()) {
      showToast('Both Find and Replace words are required.', 'error');
      return;
    }
    const regex = new RegExp(findWord.trim(), 'gi');
    let count = 0;

    // Replace in users
    users.forEach(u => {
      let changed = false;
      let newName = u.name;
      let newDept = u.department;
      let newDesig = u.designation;

      if (regex.test(u.name)) { newName = u.name.replace(regex, replaceWord.trim()); changed = true; }
      if (u.department && regex.test(u.department)) { newDept = u.department.replace(regex, replaceWord.trim()); changed = true; }
      if (u.designation && regex.test(u.designation)) { newDesig = u.designation.replace(regex, replaceWord.trim()); changed = true; }

      if (changed) {
        Storage.updateUser(u.id, { name: newName, department: newDept, designation: newDesig });
        count++;
      }
    });

    // Replace in categories
    categories.forEach(c => {
      if (regex.test(c.name)) {
        Storage.updatePostCategory(c.id, { name: c.name.replace(regex, replaceWord.trim()) });
        count++;
      }
    });

    // Replace in schools
    allTenants.forEach(t => {
      let changed = false;
      let newName = t.name;
      let newMotto = t.motto;
      if (regex.test(t.name)) { newName = t.name.replace(regex, replaceWord.trim()); changed = true; }
      if (regex.test(t.motto)) { newMotto = t.motto.replace(regex, replaceWord.trim()); changed = true; }
      if (changed) {
        updateTenant(t.id, { name: newName, motto: newMotto });
        count++;
      }
    });

    showToast(`Replaced "${findWord}" with "${replaceWord}" across ${count} record(s).`);
    setFindWord('');
    setReplaceWord('');
  };

  // ========================================================
  // 5. CATEGORIES MANAGER: ADD, EDIT, REMOVE
  // ========================================================
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    color: 'emerald' as PostCategory['color'],
    description: ''
  });

  const handleOpenAddCategory = () => {
    setEditingCatId(null);
    setCatForm({
      name: '',
      slug: '',
      color: 'indigo',
      description: ''
    });
    setShowCatModal(true);
  };

  const handleOpenEditCategory = (cat: PostCategory) => {
    setEditingCatId(cat.id);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      description: cat.description || ''
    });
    setShowCatModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showToast('Category name is required.', 'error');
      return;
    }
    const slug = catForm.slug.trim() || catForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (editingCatId) {
      Storage.updatePostCategory(editingCatId, {
        name: catForm.name.trim(),
        slug,
        color: catForm.color,
        description: catForm.description.trim()
      });
      showToast(`Updated category "${catForm.name}".`);
    } else {
      const newCat: PostCategory = {
        id: `cat-${Date.now()}`,
        name: catForm.name.trim(),
        slug,
        color: catForm.color,
        description: catForm.description.trim()
      };
      Storage.addPostCategory(newCat);
      showToast(`Added new category "${newCat.name}".`);
    }
    setShowCatModal(false);
  };

  const handleDeleteCategory = (cat: PostCategory) => {
    if (confirm(`Remove category "${cat.name}"?`)) {
      Storage.deletePostCategory(cat.id);
      showToast(`Category "${cat.name}" removed.`, 'info');
    }
  };

  // ========================================================
  // 6. MULTI-CHANNEL BROADCAST & NOTIFICATIONS ENGINE
  // ========================================================
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetScope, setBroadcastTargetScope] = useState<'all_schools' | 'selected_school' | 'specific_role'>('all_schools');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<UserRole | 'all'>('all');
  const [broadcastUrgency, setBroadcastUrgency] = useState<'normal' | 'high' | 'urgent'>('high');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast('Notification title and message are required.', 'error');
      return;
    }

    const notif: AppNotification = {
      id: `notif-broadcast-${Date.now()}`,
      title: `📣 ${broadcastTitle.trim()}`,
      message: broadcastMessage.trim(),
      category: 'announcement',
      targetRole: broadcastTargetScope === 'specific_role' ? broadcastTargetRole : 'all',
      urgency: broadcastUrgency,
      createdAt: new Date().toISOString(),
      readByUserIds: []
    };

    Storage.addNotification(notif);
    showToast(`Broadcast "${broadcastTitle}" dispatched to target audience!`, 'success');
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-xl shadow-lg border flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
          actionMessage.type === 'error' ? 'bg-rose-50 text-rose-900 border-rose-200' :
          actionMessage.type === 'info' ? 'bg-blue-50 text-blue-900 border-blue-200' :
          'bg-emerald-50 text-emerald-950 border-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            {actionMessage.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span className="text-sm font-bold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Dismiss</button>
        </div>
      )}

      {/* Top Super Admin Executive Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Super Admin Root Authority</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-mono font-bold border border-white/10">
                Multi-Tenant Governance Engine v4.2
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-serif text-white">
              Super Administrator Command Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Full centralized management across all registered school campuses. Register new institutions, customize individual school logos and background colors, control and activate/deactivate user accounts, correct spellings and typos, configure system categories, and broadcast multi-campus alerts.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[10px] text-indigo-300 uppercase font-black">Campuses</div>
              <div className="text-xl font-black font-mono text-white">{allTenants.length}</div>
              <div className="text-[10px] text-emerald-400 font-bold">100% Active</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[10px] text-indigo-300 uppercase font-black">Total Users</div>
              <div className="text-xl font-black font-mono text-white">{users.length}</div>
              <div className="text-[10px] text-indigo-200 font-bold">{users.filter(u => u.isActive !== false).length} Active</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[10px] text-indigo-300 uppercase font-black">Categories</div>
              <div className="text-xl font-black font-mono text-white">{categories.length}</div>
              <div className="text-[10px] text-amber-300 font-bold">Taxonomy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[10px] text-indigo-300 uppercase font-black">Alerts</div>
              <div className="text-xl font-black font-mono text-white">{notifications.length}</div>
              <div className="text-[10px] text-cyan-300 font-bold">Broadcasts</div>
            </div>
          </div>
        </div>

          {/* School Selector Dropdown on Header */}
          <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <School className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating School Context</div>
                <div className="text-xs font-black text-white flex items-center gap-2">
                  <span>{targetSchool.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                    {targetSchool.code}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="school-context-select" className="text-xs text-slate-300 font-bold">Target Campus:</label>
              <select
                id="school-context-select"
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  switchTenant(e.target.value);
                }}
                className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {allTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>

              <button
                onClick={handleOpenNewSchoolModal}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New School</span>
              </button>
            </div>
          </div>
      </div>

      {/* Sub Navigation Bar with Distinct Tool Modules */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveSubTab('schools')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'schools'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. School Campuses ({allTenants.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branding')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-300" />
          <span>2. Logo & Background Customizer</span>
          <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">PER SCHOOL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. User & Staff Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('spelling')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'spelling'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <SpellCheck className="w-4 h-4 text-emerald-300" />
          <span>4. Spelling Corrector & Mass Fixer</span>
          {spellingIssuesFound.length > 0 && (
            <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-bold">
              {spellingIssuesFound.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>5. Categories Hub ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notify')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'notify'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-300" />
          <span>6. Broadcast Alert Center</span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: REGISTER SCHOOLS & CAMPUS MANAGEMENT
          ======================================================== */}
      {activeSubTab === 'schools' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">Registered School Campuses (Multi-Tenancy)</h2>
              <p className="text-xs text-slate-500">Each campus maintains independent branding, registers, staff, and learners.</p>
            </div>
            <button
              onClick={handleOpenNewSchoolModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New School</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTenants.map((school) => {
              const isCurrent = school.id === currentTenant.id;
              const schoolUsers = users.filter(u => u.schoolId === school.id);
              return (
                <div 
                  key={school.id} 
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    isCurrent ? 'ring-2 ring-indigo-600 shadow-md border-indigo-200' : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                  style={{
                    backgroundColor: school.backgroundColor ? `${school.backgroundColor}0D` : undefined
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {school.logoUrl ? (
                        <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                          {school.crestIcon === 'school' ? <School className="w-6 h-6" /> :
                           school.crestIcon === 'shield' ? <Shield className="w-6 h-6" /> :
                           school.crestIcon === 'book-open' ? <BookOpen className="w-6 h-6" /> :
                           <GraduationCap className="w-6 h-6" />}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 font-serif">{school.name}</h3>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 italic mt-0.5 max-w-sm line-clamp-1">{school.motto}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditSchoolModal(school)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="Edit School Metadata"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSchoolId(school.id);
                          setActiveSubTab('branding');
                        }}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                        title="Customize Logo & Background"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchool(school)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Remove School"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* School details grid */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">NEMIS Code:</span>
                      <div className="font-mono font-bold text-slate-800">{school.registrationNumber || school.code}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Principal:</span>
                      <div className="font-bold text-slate-800 truncate">{school.principalName}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Location:</span>
                      <div className="font-medium text-slate-700 truncate">{school.city}, {school.county}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Assigned Users:</span>
                      <div className="font-bold text-slate-800">{schoolUsers.length > 0 ? `${schoolUsers.length} Users` : 'All Base'}</div>
                    </div>
                  </div>

                  {/* Branding Color Pill & Quick Switch */}
                  <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs" 
                        style={{ backgroundColor: school.backgroundColor || '#f8fafc' }} 
                        title={`School background: ${school.backgroundColor || '#f8fafc'}`}
                      />
                      <span className="text-[11px] text-slate-500 font-mono">{school.backgroundColor || '#f8fafc'}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSchoolId(school.id);
                        switchTenant(school.id);
                        showToast(`Switched active workspace to "${school.name}".`);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        isCurrent 
                          ? 'bg-slate-100 text-slate-600 cursor-default'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isCurrent ? 'Current Campus' : 'Switch to This Campus'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: LOGO & BACKGROUND COLOR CUSTOMIZER
          ======================================================== */}
      {activeSubTab === 'branding' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900">School Identity & Background Customizer</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customize the crest logo and background color for <strong>{targetSchool.name}</strong>. Super Admin can configure any school; changes apply across the entire portal immediately.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="customizer-school-select" className="text-xs text-slate-500 font-bold">Select School:</label>
              <select
                id="customizer-school-select"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {allTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* SECTION A: LOGO CUSTOMIZATION */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>A. School Logo & Crest Customization</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">SVG or PNG</span>
                </div>

                {/* Crest Icon Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Default Crest Icon Emblem</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['school', 'graduation-cap', 'book-open', 'shield'] as const).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedCrest(icon)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          selectedCrest === icon 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {icon === 'school' && <School className="w-5 h-5" />}
                        {icon === 'graduation-cap' && <GraduationCap className="w-5 h-5" />}
                        {icon === 'book-open' && <BookOpen className="w-5 h-5" />}
                        {icon === 'shield' && <Shield className="w-5 h-5" />}
                        <span className="capitalize text-[11px]">{icon.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Logo Image URL or Upload */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Custom School Logo URL or Data Image</label>
                  <input
                    type="text"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://... or data:image/svg+xml;utf8,..."
                    className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Upload Logo Image from Computer</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>
                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomLogoUrl('')}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Clear Logo
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION B: BACKGROUND COLOR CUSTOMIZATION */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>B. School Background Color Customization</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Applies to Entire App</span>
                </div>

                {/* Preset background palettes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Preset School Color Palettes</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BG_PALETTES.map((pal) => (
                      <button
                        key={pal.hex}
                        type="button"
                        onClick={() => setCustomBgColor(pal.hex)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          customBgColor.toLowerCase() === pal.hex.toLowerCase()
                            ? 'ring-2 ring-indigo-600 border-indigo-500 font-black shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-2xs" 
                          style={{ backgroundColor: pal.hex }} 
                        />
                        <div className="overflow-hidden">
                          <div className="text-[11px] truncate font-bold text-slate-900">{pal.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pal.hex}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-300">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-bold text-slate-700">Custom Hex:</span>
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-24 text-xs font-mono font-bold focus:outline-none uppercase"
                    />
                  </div>

                  <span className="text-xs text-slate-500">Pick any exact institutional hex code</span>
                </div>

                {/* Header Gradient Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Top Header Gradient Style</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {HEADER_GRADIENTS.map((hg) => (
                      <button
                        key={hg.label}
                        type="button"
                        onClick={() => setSelectedHeaderGradient(hg.class)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          selectedHeaderGradient === hg.class
                            ? 'ring-2 ring-indigo-600 border-indigo-500 font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md bg-gradient-to-r ${hg.class} shrink-0 shadow-2xs`} />
                        <span className="text-xs text-slate-800 truncate font-semibold">{hg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save & Apply Action Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveBranding}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-black text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Apply Branding to {targetSchool.name}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomBgColor('#f8fafc');
                    setSelectedHeaderGradient('from-emerald-900 via-slate-900 to-emerald-950');
                    setCustomLogoUrl('');
                    showToast('Reset branding values to clean default.', 'info');
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Live School Preview</span>
                </h3>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  REAL-TIME PREVIEW
                </span>
              </div>

              {/* Preview Container rendered with the selected background color */}
              <div 
                className="rounded-2xl p-4 border border-slate-300 shadow-md transition-colors duration-300 space-y-4"
                style={{ backgroundColor: customBgColor }}
              >
                {/* Simulated Navbar Header */}
                <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedHeaderGradient} text-white shadow-md flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-2.5">
                    {customLogoUrl ? (
                      <div className="w-9 h-9 rounded-lg bg-white p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                        <img src={customLogoUrl} alt="Preview Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-white/20 text-amber-300 flex items-center justify-center shrink-0">
                        {selectedCrest === 'school' ? <School className="w-5 h-5" /> :
                         selectedCrest === 'shield' ? <Shield className="w-5 h-5" /> :
                         selectedCrest === 'book-open' ? <BookOpen className="w-5 h-5" /> :
                         <GraduationCap className="w-5 h-5" />}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-black font-serif text-white">{targetSchool.name}</div>
                      <div className="text-[9px] text-slate-300 italic">{targetSchool.motto}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                    {targetSchool.code}
                  </span>
                </div>

                {/* Simulated Content Card */}
                <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Student Assessment Progress</span>
                    <span className="text-[10px] text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-md">Grade 4 Dove</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-3/4" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>CBC Formative CBA Tasks</span>
                      <span className="font-bold text-slate-800">75% Complete</span>
                    </div>
                  </div>
                </div>

                {/* Official Letterhead Sample */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-[11px] text-slate-700 space-y-2">
                  <div className="text-center pb-2 border-b border-slate-200">
                    <div className="font-black text-xs font-serif text-slate-900">{targetSchool.name.toUpperCase()}</div>
                    <div className="text-[10px] text-slate-500">{targetSchool.address} · {targetSchool.city}</div>
                    <div className="text-[9px] text-slate-400 font-mono">MOE REG: {targetSchool.registrationNumber}</div>
                  </div>
                  <div className="text-[10px] italic text-slate-600">
                    Official transcripts and documents will bear this customized institutional insignia and header styling.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: USER & STAFF MANAGEMENT (ACTIVATE / DEACTIVATE / ADD / REMOVE)
          ======================================================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">System Users & Account Governance</h2>
              <p className="text-xs text-slate-500">Manage, edit, activate, deactivate, or assign accounts across all schools.</p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, admission #..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer font-bold"
              >
                <option value="all">All Roles (Any)</option>
                <option value="teacher">Subject Teacher</option>
                <option value="class_teacher">Class Teacher</option>
                <option value="student">Student / Learner</option>
                <option value="parent">Parent</option>
                <option value="hod">Head of Department (HOD)</option>
                <option value="senior_teacher">Senior Teacher</option>
                <option value="deputy_head">Deputy Head Teacher</option>
                <option value="head_teacher">Head Teacher</option>
                <option value="school_admin_staff">School Admin Staff</option>
                <option value="librarian">Librarian</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div>
              <select
                value={userSchoolFilter}
                onChange={(e) => setUserSchoolFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer font-bold"
              >
                <option value="all">All Schools / Global</option>
                {allTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer font-bold"
              >
                <option value="all">All Statuses (Active & Deactivated)</option>
                <option value="active">Active Accounts Only</option>
                <option value="deactivated">Deactivated Accounts Only</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">User & Identity</th>
                    <th className="p-3.5">Role & Access</th>
                    <th className="p-3.5">School Campus</th>
                    <th className="p-3.5">Contact & Identifiers</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No users matching your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.slice(0, 50).map((u) => {
                      const isActive = u.isActive !== false;
                      const school = allTenants.find(t => t.id === u.schoolId);
                      return (
                        <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${!isActive ? 'bg-rose-50/30' : ''}`}>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                              {u.role.replace('_', ' ')}
                            </span>
                            {u.grade && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Grade {u.grade} {u.stream ? `(${u.stream})` : ''}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="text-slate-800 font-medium truncate max-w-[150px]">
                              {school ? school.shortName : 'Universal'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{school ? school.code : 'ROOT'}</div>
                          </td>

                          <td className="p-3.5 text-slate-600">
                            <div>{u.phone || '—'}</div>
                            <div className="text-[10px] font-mono text-slate-400">{u.admissionNumber || u.tscNumber || ''}</div>
                          </td>

                          {/* Status / Activation Toggle Button */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleUserActivation(u)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                                isActive 
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title={isActive ? 'Click to deactivate account' : 'Click to activate account'}
                            >
                              {isActive ? <UserCheck className="w-3 h-3 text-emerald-700" /> : <UserX className="w-3 h-3 text-rose-700" />}
                              <span>{isActive ? 'Active' : 'Deactivated'}</span>
                            </button>
                          </td>

                          {/* Actions: Edit, Assign, Delete */}
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                              title="Edit user details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredUsers.length > 50 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                Showing top 50 of {filteredUsers.length} total users. Narrow down via search or role filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: SPELLING CORRECTOR & MASS DATA POLISHER
          ======================================================== */}
      {activeSubTab === 'spelling' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <SpellCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-black text-slate-900">Institutional Spelling Scanner & Data Polisher</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Correct typos and common misspelled educational words across user names, departments, school titles, and category taxonomies.
                </p>
              </div>

              <button
                type="button"
                onClick={runSpellingScan}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan Entire Database for Typos</span>
              </button>
            </div>

            {/* Results of Scanner */}
            {hasScanned && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Scan Results: {spellingIssuesFound.length} typo(s) identified
                  </span>
                  {spellingIssuesFound.length > 0 && (
                    <button
                      onClick={applyAllSpellingFixes}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Correct All ({spellingIssuesFound.length})
                    </button>
                  )}
                </div>

                {spellingIssuesFound.length === 0 ? (
                  <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>No known spelling errors found! All records match standard CBC nomenclature.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {spellingIssuesFound.map((issue) => (
                      <div key={issue.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400">{issue.type} · {issue.field}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-rose-600 line-through font-mono">{issue.original}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-emerald-700 font-bold font-mono">{issue.proposed}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => applySingleSpellingFix(issue)}
                          className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Apply Fix
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Global Find and Replace */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Global Mass Find & Replace</span>
              </h3>
              <p className="text-xs text-slate-600">
                Replace any word, term, or acronym across all users, categories, and school mottos instantly.
              </p>

              <form onSubmit={handleGlobalFindAndReplace} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={findWord}
                  onChange={(e) => setFindWord(e.target.value)}
                  placeholder="Find word (e.g. Scool)..."
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <input
                  type="text"
                  value={replaceWord}
                  onChange={(e) => setReplaceWord(e.target.value)}
                  placeholder="Replace with (e.g. School)..."
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  Replace in All Records
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 5: CATEGORIES HUB
          ======================================================== */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">System Categories & Taxonomies</h2>
              <p className="text-xs text-slate-500">Add, edit, remove, and manage categories for announcements, posts, and curriculum sections.</p>
            </div>
            <button
              onClick={handleOpenAddCategory}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-${cat.color}-50 text-${cat.color}-700 border-${cat.color}-200`}>
                      {cat.color}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                        title="Edit category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400">slug: #{cat.slug}</div>
                  {cat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 6: BROADCAST ALERT CENTER
          ======================================================== */}
      {activeSubTab === 'notify' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span>Super Admin Broadcast & Notification Dispatcher</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch urgent announcements, system maintenance directives, or administrative alerts to specific schools or roles.
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target School Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTargetScope('all_schools')}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      broadcastTargetScope === 'all_schools' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    All Schools (Global)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTargetScope('selected_school')}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      broadcastTargetScope === 'selected_school' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {targetSchool.shortName} Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTargetScope('specific_role')}
                    className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      broadcastTargetScope === 'specific_role' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Specific Role
                  </button>
                </div>
              </div>

              {broadcastTargetScope === 'specific_role' && (
                <div>
                  <label htmlFor="broadcast-target-role-select" className="text-xs font-bold text-slate-700 block mb-1">Target Role</label>
                  <select
                    id="broadcast-target-role-select"
                    value={broadcastTargetRole}
                    onChange={(e) => setBroadcastTargetRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="teacher">All Teachers</option>
                    <option value="student">All Students</option>
                    <option value="parent">All Parents</option>
                    <option value="school_admin_staff">School Admin Staff</option>
                    <option value="head_teacher">Head Teachers</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Urgency Level</label>
                <div className="flex gap-2">
                  {(['normal', 'high', 'urgent'] as const).map(urg => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setBroadcastUrgency(urg)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                        broadcastUrgency === urg 
                          ? urg === 'urgent' ? 'bg-rose-600 text-white border-rose-600' :
                            urg === 'high' ? 'bg-amber-600 text-white border-amber-600' :
                            'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Broadcast Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Ministry Directive: Term 1 CBA Moderation Timetable..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Broadcast Message</label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type official notification body text..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Broadcast Notification</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Recent Dispatched Alerts</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {notifications.slice(0, 10).map((n) => (
                <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      n.urgency === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {n.urgency}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{n.title}</div>
                  <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REGISTER / EDIT SCHOOL
          ======================================================== */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-black text-slate-900 font-serif">
                {editingSchoolId ? 'Edit School Campus' : 'Register New School Campus'}
              </h3>
              <button 
                onClick={() => setShowSchoolModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">School Full Name *</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.name}
                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                    placeholder="e.g. St. Austin's Academy"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-serif"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Name / Moniker</label>
                  <input
                    type="text"
                    value={schoolForm.shortName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, shortName: e.target.value })}
                    placeholder="e.g. St. Austin's"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motto / Educational Philosophy</label>
                <input
                  type="text"
                  value={schoolForm.motto}
                  onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
                  placeholder="e.g. Excellence in Scholarship and Service"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">School Code *</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                    placeholder="SAA-NBI-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">NEMIS / MOE Registration #</label>
                  <input
                    type="text"
                    value={schoolForm.registrationNumber}
                    onChange={(e) => setSchoolForm({ ...schoolForm, registrationNumber: e.target.value })}
                    placeholder="MOE/PRI-JSS/2026/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Established Year</label>
                  <input
                    type="number"
                    value={schoolForm.establishedYear}
                    onChange={(e) => setSchoolForm({ ...schoolForm, establishedYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Principal / Head of Institution</label>
                  <input
                    type="text"
                    value={schoolForm.principalName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                    placeholder="Dr. Elizabeth Mutua, PhD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Principal Official Title</label>
                  <input
                    type="text"
                    value={schoolForm.principalTitle}
                    onChange={(e) => setSchoolForm({ ...schoolForm, principalTitle: e.target.value })}
                    placeholder="Head of Institution & Principal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City / Town</label>
                  <input
                    type="text"
                    value={schoolForm.city}
                    onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                    placeholder="Nairobi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">County</label>
                  <input
                    type="text"
                    value={schoolForm.county}
                    onChange={(e) => setSchoolForm({ ...schoolForm, county: e.target.value })}
                    placeholder="Nairobi County"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={schoolForm.phone}
                    onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                    placeholder="+254 7..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSchoolModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md transition-all cursor-pointer"
                >
                  {editingSchoolId ? 'Save Changes' : 'Register Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT USER
          ======================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-black text-slate-900">
                {editingUserId ? 'Edit Account Details' : 'Create New User Account'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Mary Wanjiku"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="mary@school.edusmart.ac.ke"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="+254 7..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">System Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="student">Student / Learner</option>
                    <option value="parent">Parent</option>
                    <option value="teacher">Subject Teacher</option>
                    <option value="class_teacher">Class Teacher</option>
                    <option value="hod">Head of Department (HOD)</option>
                    <option value="senior_teacher">Senior Teacher</option>
                    <option value="deputy_head">Deputy Head Teacher</option>
                    <option value="head_teacher">Head Teacher</option>
                    <option value="school_admin_staff">School Admin Staff</option>
                    <option value="librarian">Librarian</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned School Campus</label>
                  <select
                    value={userForm.schoolId}
                    onChange={(e) => setUserForm({ ...userForm, schoolId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {allTenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {userForm.role === 'student' && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Grade</label>
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={userForm.grade}
                      onChange={(e) => setUserForm({ ...userForm, grade: Number(e.target.value) as GradeLevel })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stream</label>
                    <input
                      type="text"
                      value={userForm.stream}
                      onChange={(e) => setUserForm({ ...userForm, stream: e.target.value as StreamName })}
                      placeholder="Dove"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Admission #</label>
                    <input
                      type="text"
                      value={userForm.admissionNumber}
                      onChange={(e) => setUserForm({ ...userForm, admissionNumber: e.target.value })}
                      placeholder="ADM-2026-001"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Active / Deactivated Switch in Form */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="user-is-active"
                  checked={userForm.isActive}
                  onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="user-is-active" className="font-bold text-slate-800 cursor-pointer">
                  Account is Active (Uncheck to Deactivate this user immediately)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md cursor-pointer"
                >
                  {editingUserId ? 'Save User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT CATEGORY
          ======================================================== */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-black text-slate-900">
                {editingCatId ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Science & STEM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL / Key Slug</label>
                <input
                  type="text"
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  placeholder="e.g. science-stem"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Theme Color</label>
                <select
                  value={catForm.color}
                  onChange={(e) => setCatForm({ ...catForm, color: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="emerald">Emerald Green</option>
                  <option value="indigo">Indigo</option>
                  <option value="amber">Amber / Gold</option>
                  <option value="rose">Rose Crimson</option>
                  <option value="blue">Sky Blue</option>
                  <option value="purple">Royal Purple</option>
                  <option value="teal">Teal Cyan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Brief description of when this category applies..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md cursor-pointer"
                >
                  {editingCatId ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
