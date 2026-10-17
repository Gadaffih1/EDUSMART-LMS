export type StaffCategory = 'Teaching' | 'Non-Teaching';
export type AttendanceStatus = 'Present' | 'On Leave' | 'Absent' | 'Late';
export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Maternity Leave' | 'Paternity Leave' | 'Compassionate Leave' | 'Study / CPD Leave';
export type ProcessStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'In Progress' | 'Resolved';

export interface HRStaffMember {
  id: string;
  tenantId: string;
  name: string;
  employeeNumber: string;
  category: StaffCategory;
  department: string;
  designation: string;
  tscNumber?: string;
  nationalId: string;
  kraPin: string;
  nssfNumber: string;
  nhifShifNumber: string;
  phone: string;
  email: string;
  attendanceToday: AttendanceStatus;
  dateOfJoining: string;
  contractExpiryDate: string;
  isContractExpiringSoon: boolean;
  activeLeaveDaysBalance: number;
}

export interface HRLeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  substituteTeacher?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  approvedDate?: string;
  approvedBy?: string;
}

export interface HRRecruitmentApplication {
  id: string;
  tenantId: string;
  applicantName: string;
  positionApplied: string;
  department: string;
  email: string;
  phone: string;
  yearsExperience: number;
  education: string;
  stage: 'Applied' | 'Shortlisted' | 'Interviewed' | 'Offered' | 'Hired';
  applicationDate: string;
  status: 'Pending' | 'Shortlisted' | 'Interview Scheduled' | 'Offer Issued' | 'Hired' | 'Rejected';
  notes?: string;
}

export interface HRPerformanceReview {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  designation: string;
  reviewPeriod: string;
  evaluatorName: string;
  cbcPedagogyScore: number; // out of 5
  learnerProgressScore: number; // out of 5
  professionalismScore: number; // out of 5
  compositeScore: number; // out of 5
  status: 'Pending Review' | 'Completed';
  submissionDate: string;
  remarks: string;
}

export interface HRTrainingApproval {
  id: string;
  tenantId: string;
  title: string;
  provider: string;
  department: string;
  participantsCount: number;
  dates: string;
  budgetKsh: number;
  status: 'Pending' | 'Approved' | 'Declined';
  requestedBy: string;
  requestedDate: string;
  cpdPointsAwarded: number;
}

export interface HRCaseItem {
  id: string;
  tenantId: string;
  caseNumber: string;
  subject: string;
  employeeId: string;
  employeeName: string;
  department: string;
  severity: 'Low' | 'Medium' | 'High';
  category: 'Grievance' | 'Disciplinary' | 'Policy Query' | 'Health & Safety';
  dateReported: string;
  status: 'Pending Investigation' | 'Hearing Scheduled' | 'Resolved';
  resolutionNotes?: string;
  resolvedDate?: string;
}

export interface HREmployeeDocument {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  title: string;
  category: 'Employment Contract' | 'Appraisal Form' | 'Professional Certificate' | 'Statutory & Tax';
  fileFormat: 'PDF' | 'DOCX';
  uploadDate: string;
  verified: boolean;
  sizeKb: number;
  documentRefNumber: string;
  contentSummary: string;
  expiresOn?: string;
}

export interface HRWorkforceSummary {
  totalStaff: number;
  teaching: number;
  nonTeaching: number;
  present: number;
  onLeave: number;
  absent: number;
  openVacancies: number;
  contractsExpiringSoon: number;
  pendingLeavesCount: number;
  pendingRecruitmentCount: number;
  pendingPerformanceCount: number;
  pendingTrainingCount: number;
  pendingCasesCount: number;
}
