import React, { useState, useEffect } from 'react';
import { 
  User, 
  DocumentSubmissionRequest, 
  DocumentSubmission, 
  GradeLevel, 
  UserRole 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  X, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Check, 
  RotateCcw, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Paperclip, 
  ChevronRight, 
  ExternalLink,
  Trash2,
  Edit2,
  FileCheck
} from 'lucide-react';

interface DocumentRequestsHubProps {
  currentUser: User;
  onBack?: () => void;
}

export const DocumentRequestsHub: React.FC<DocumentRequestsHubProps> = ({ 
  currentUser,
  onBack 
}) => {
  const [requests, setRequests] = useState<DocumentSubmissionRequest[]>(() => Storage.getDocumentRequests());
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>(() => Storage.getDocumentSubmissions());
  const [allUsers, setAllUsers] = useState<User[]>(() => Storage.getUsers());
  
  const [activeTab, setActiveTab] = useState<'requests' | 'review_desk' | 'my_submissions'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // New Request Form Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-11-20');
  const [newMandatory, setNewMandatory] = useState(true);
  const [newRequiredTypes, setNewRequiredTypes] = useState<string[]>(['Birth Certificate (PDF or JPG)']);
  const [newCustomTypeInput, setNewCustomTypeInput] = useState('');
  const [newTargetUserIds, setNewTargetUserIds] = useState<string[]>([]);
  const [newTargetGrade, setNewTargetGrade] = useState<GradeLevel | ''>('');
  const [newTargetRole, setNewTargetRole] = useState<UserRole | 'all'>('all');

  // Review / Verification Modal State
  const [reviewingSubmission, setReviewingSubmission] = useState<DocumentSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'verified' | 'resubmit_requested' | 'rejected'>('verified');

  // Submit Document Form Modal State (for learner/parent/user)
  const [submittingRequestId, setSubmittingRequestId] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const handleReqs = () => setRequests(Storage.getDocumentRequests());
    const handleSubs = () => setSubmissions(Storage.getDocumentSubmissions());
    window.addEventListener('document-requests-updated', handleReqs);
    window.addEventListener('document-submissions-updated', handleSubs);
    return () => {
      window.removeEventListener('document-requests-updated', handleReqs);
      window.removeEventListener('document-submissions-updated', handleSubs);
    };
  }, []);

  const userPerms = Storage.getUserEffectivePermissions(currentUser);
  const canManageRequests = userPerms.canRequestDocumentSubmissions || currentUser.role === 'admin';

  // Create Document Request
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please provide a title for the document request.', 'error');
      return;
    }

    if (newTargetUserIds.length === 0 && newTargetRole === 'all') {
      showToast('Please select specific target users or a specific target role.', 'error');
      return;
    }

    const newReq: DocumentSubmissionRequest = {
      id: `doc-req-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      instructions: newInstructions.trim(),
      requestedByUserId: currentUser.id,
      requestedByUserName: currentUser.name,
      requestedByUserRole: currentUser.role,
      targetUserIds: newTargetUserIds,
      targetGrade: newTargetGrade ? (Number(newTargetGrade) as GradeLevel) : undefined,
      targetRole: newTargetRole === 'all' ? undefined : newTargetRole,
      dueDate: newDueDate,
      requiredDocTypes: newRequiredTypes.length > 0 ? newRequiredTypes : ['Official Document (PDF)'],
      mandatory: newMandatory,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    Storage.addDocumentRequest(newReq);
    showToast(`Document Request "${newReq.title}" created and dispatched!`, 'success');
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewInstructions('');
    setNewTargetUserIds([]);
  };

  // Delete Request
  const handleDeleteRequest = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the document request "${title}"?`)) {
      Storage.deleteDocumentRequest(id);
      showToast(`Document request "${title}" deleted.`, 'info');
    }
  };

  // Review & Verify Submission
  const handleSaveReview = () => {
    if (!reviewingSubmission) return;

    Storage.updateDocumentSubmission(reviewingSubmission.id, {
      status: reviewStatus,
      reviewNotes: reviewNotes.trim(),
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString()
    });

    showToast(`Submission by ${reviewingSubmission.userName} marked as ${reviewStatus.replace('_', ' ').toUpperCase()}!`, 'success');
    setReviewingSubmission(null);
    setReviewNotes('');
  };

  // Handle User Uploading File
  const handleUserUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingRequestId) return;
    if (!uploadFileName.trim()) {
      showToast('Please enter a document file name.', 'error');
      return;
    }

    setIsSimulatingUpload(true);
    setTimeout(() => {
      const newSub: DocumentSubmission = {
        id: `sub-${Date.now()}`,
        requestId: submittingRequestId,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        fileName: uploadFileName.trim(),
        fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        fileType: uploadFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        notes: uploadNotes.trim(),
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };

      Storage.addDocumentSubmission(newSub);
      setIsSimulatingUpload(false);
      setSubmittingRequestId(null);
      setUploadFileName('');
      setUploadNotes('');
      showToast('Document uploaded successfully! It is now pending administrative verification.', 'success');
    }, 600);
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.requestedByUserName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter submissions
  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Submissions targeting currently logged-in user
  const myTargetedRequests = requests.filter(r => {
    const targetedDirectly = r.targetUserIds.includes(currentUser.id);
    const targetedRole = r.targetRole && r.targetRole === currentUser.role;
    const targetedGrade = r.targetGrade && currentUser.grade && r.targetGrade === currentUser.grade;
    return targetedDirectly || targetedRole || targetedGrade || (r.targetUserIds.length === 0 && !r.targetRole);
  });

  // Metrics
  const totalRequestsCount = requests.length;
  const totalSubmissionsCount = submissions.length;
  const verifiedCount = submissions.filter(s => s.status === 'verified').length;
  const pendingReviewCount = submissions.filter(s => s.status === 'submitted').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-300" />
                <span>Role 1 Privilege: Document Request Engine</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                KNEC, CBA & Official Records
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Document Submission Requests Hub</span>
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Issue formal requests for documents from specific students, teachers, parents, or staff. Track submission compliance, verify uploaded files, and provide qualitative validation notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canManageRequests && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Request Documents from Users</span>
              </button>
            )}

            {onBack && (
              <button
                onClick={onBack}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer"
              >
                Back to Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Active Requests</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalRequestsCount}</div>
          <div className="text-[10px] text-blue-600 font-bold mt-0.5">Authoritative Requests</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Documents Uploaded</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{totalSubmissionsCount}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Files Received</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Verified & Approved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount}</div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Verified Documents</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Pending Verification</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingReviewCount}</div>
          <div className="text-[10px] text-amber-700 font-bold mt-0.5">Requires Review</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Active Document Requests ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('review_desk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'review_desk'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verification & Review Desk ({submissions.length})</span>
          {pendingReviewCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-900">
              {pendingReviewCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_submissions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_submissions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Required Documents ({myTargetedRequests.length})</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: ACTIVE DOCUMENT REQUESTS
          ======================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests by title, target, or requesting officer..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
              >
                <option value="all">All Request Statuses</option>
                <option value="active">Active & Open</option>
                <option value="closed">Closed / Archived</option>
              </select>
            </div>
          </div>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => {
              const reqSubmissions = submissions.filter(s => s.requestId === req.id);
              const targetCount = req.targetUserIds.length > 0 ? req.targetUserIds.length : (req.targetGrade ? 8 : 15);
              const percent = Math.min(100, Math.round((reqSubmissions.length / Math.max(1, targetCount)) * 100));

              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between">
                  
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          req.mandatory ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {req.mandatory ? '⚠️ Mandatory Submission' : 'Optional Submission'}
                        </span>
                        <h4 className="font-black text-sm text-slate-900 mt-1.5">{req.title}</h4>
                      </div>

                      {canManageRequests && (
                        <button
                          onClick={() => handleDeleteRequest(req.id, req.title)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete document request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {req.description}
                    </p>

                    {/* Target Specific Users Pill Strip */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="font-bold text-slate-700 flex items-center justify-between">
                        <span>Target Specific Users:</span>
                        <span className="font-mono text-blue-700">
                          {req.targetUserIds.length > 0 ? `${req.targetUserIds.length} Designated Users` : req.targetRole ? `All ${req.targetRole}s` : 'Whole School'}
                        </span>
                      </div>

                      {req.targetUserIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {req.targetUserIds.map((uid) => {
                            const u = allUsers.find(x => x.id === uid);
                            return (
                              <span key={uid} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-800">
                                {u ? u.name : uid}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Required Documents Checklist */}
                    <div className="space-y-1 text-xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Required Files:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {req.requiredDocTypes.map((dt, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-medium flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-blue-600" />
                            <span>{dt}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submission Progress & Due Date Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {req.dueDate}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {reqSubmissions.length} of {targetCount} Submitted ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        By {req.requestedByUserName} ({req.requestedByUserRole})
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab('review_desk');
                          setSearchQuery(req.title);
                        }}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View {reqSubmissions.length} Uploads</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 2: VERIFICATION & REVIEW DESK
          ======================================================== */}
      {activeTab === 'review_desk' && (
        <div className="space-y-4">
          
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search uploaded files by user name, document name, email..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
              >
                <option value="all">All Verification Statuses</option>
                <option value="submitted">Pending Review (Submitted)</option>
                <option value="verified">Verified & Approved</option>
                <option value="resubmit_requested">Resubmit Requested</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-3 px-4">Learner / User</th>
                    <th className="py-3 px-3">Associated Request</th>
                    <th className="py-3 px-3">Uploaded Document</th>
                    <th className="py-3 px-3">Submitted Date</th>
                    <th className="py-3 px-3">Verification Status</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => {
                    const req = requests.find(r => r.id === sub.requestId);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{sub.userName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{sub.userEmail} ({sub.userRole})</div>
                        </td>

                        <td className="py-3 px-3 text-slate-800 max-w-xs truncate font-medium">
                          {req ? req.title : 'General Document Request'}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 truncate max-w-xs">{sub.fileName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{sub.fileSize || '2.4 MB'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            sub.status === 'verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            sub.status === 'submitted' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            sub.status === 'resubmit_requested' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                          {sub.reviewedBy && (
                            <div className="text-[9px] text-slate-400 mt-0.5">By {sub.reviewedBy}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setReviewingSubmission(sub);
                              setReviewStatus(sub.status === 'submitted' ? 'verified' : sub.status as any);
                              setReviewNotes(sub.reviewNotes || '');
                            }}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            <span>Verify & Remarks</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 3: MY SUBMISSIONS / USER UPLOAD DESK
          ======================================================== */}
      {activeTab === 'my_submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Official Document Requests Requiring Your Submission</span>
            </h3>
            <p className="text-xs text-slate-500">
              Below are official institutional requests issued to your profile. Please submit the requested digital records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTargetedRequests.map((req) => {
              const mySubmission = submissions.find(s => s.requestId === req.id && s.userId === currentUser.id);

              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-300 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        mySubmission?.status === 'verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        mySubmission ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {mySubmission ? `Status: ${mySubmission.status.replace('_', ' ')}` : 'Pending Submission'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Due {req.dueDate}</span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900">{req.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>

                    {req.instructions && (
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                        <span className="font-bold">Instructions:</span>
                        <p>{req.instructions}</p>
                      </div>
                    )}

                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-700">Required:</span>
                      <div className="flex flex-wrap gap-1">
                        {req.requiredDocTypes.map((dt, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px]">
                            {dt}
                          </span>
                        ))}
                      </div>
                    </div>

                    {mySubmission && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Uploaded: {mySubmission.fileName}</span>
                        </div>
                        {mySubmission.reviewNotes && (
                          <div className="text-[11px] text-indigo-700 italic">
                            Officer Review Remarks: "{mySubmission.reviewNotes}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Requested by {req.requestedByUserName}
                    </span>

                    <button
                      onClick={() => {
                        setSubmittingRequestId(req.id);
                        setUploadFileName(mySubmission ? mySubmission.fileName : `${currentUser.name.replace(/\s+/g, '_')}_Document.pdf`);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{mySubmission ? 'Re-upload / Update' : 'Upload Document'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE NEW DOCUMENT REQUEST (ROLE 1 PRIVILEGE)
          ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Create New Document Submission Request
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Official Institutional Request to Specific Users
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Request Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Grade 4 CBC Transition Dossier & Birth Certificate"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Purpose</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explain why this document is required (e.g. For official NEMIS and KNEC registration)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Submission Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMandatory}
                      onChange={(e) => setNewMandatory(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span className="font-bold text-slate-800">Mandatory Submission Requirement</span>
                  </label>
                </div>
              </div>

              {/* TARGET USERS SELECTOR */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Target Specific Users from Directory</span>
                  </h4>
                  <span className="text-[11px] font-mono text-blue-700 font-bold">
                    {newTargetUserIds.length} Selected
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto bg-white rounded-xl border border-slate-200 p-2 divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <label key={u.id} className="py-1.5 px-2 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer">
                      <div>
                        <span className="font-bold text-slate-900">{u.name}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">({u.role} · {u.email})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newTargetUserIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTargetUserIds([...newTargetUserIds, u.id]);
                          } else {
                            setNewTargetUserIds(newTargetUserIds.filter(id => id !== u.id));
                          }
                        }}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* REQUIRED DOCUMENT TYPES */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Required Document Types</label>
                <div className="flex flex-wrap gap-1.5">
                  {newRequiredTypes.map((dt, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-900 rounded-lg text-xs font-medium border border-blue-200 flex items-center gap-1.5">
                      <span>{dt}</span>
                      <button
                        type="button"
                        onClick={() => setNewRequiredTypes(newRequiredTypes.filter((_, i) => i !== idx))}
                        className="text-blue-500 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newCustomTypeInput}
                    onChange={(e) => setNewCustomTypeInput(e.target.value)}
                    placeholder="Add document type (e.g. Immunization Card, Parent ID, TPAD Portfolio)..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCustomTypeInput.trim()) {
                        setNewRequiredTypes([...newRequiredTypes, newCustomTypeInput.trim()]);
                        setNewCustomTypeInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Add Type
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions for Submitting Users</label>
                <textarea
                  rows={2}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="e.g. Please ensure certificate scans are clear and not blurry. Max file size 15MB..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Create & Dispatch Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VERIFY & REVIEW SUBMISSION
          ======================================================== */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-slate-900">Document Verification Desk</h3>
              </div>
              <button onClick={() => setReviewingSubmission(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div><strong>Submitted By:</strong> {reviewingSubmission.userName} ({reviewingSubmission.userEmail})</div>
              <div><strong>Document Name:</strong> {reviewingSubmission.fileName} ({reviewingSubmission.fileSize})</div>
              <div><strong>Submitted On:</strong> {new Date(reviewingSubmission.submittedAt).toLocaleString()}</div>
              {reviewingSubmission.notes && (
                <div><strong>Learner/Parent Notes:</strong> "{reviewingSubmission.notes}"</div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification Decision</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="verified">✅ Verified & Approved (Compliant)</option>
                  <option value="resubmit_requested">🔄 Needs Resubmission (Blurry/Incomplete)</option>
                  <option value="rejected">❌ Rejected (Invalid Document)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification Remarks / Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Validated against KNEC CBA index register. Fully certified."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setReviewingSubmission(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs"
              >
                Save Verification Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: USER UPLOAD DOCUMENT
          ======================================================== */}
      {submittingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm text-slate-900">Upload Requested Document</h3>
              </div>
              <button onClick={() => setSubmittingRequestId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUserUploadDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document File Name *</label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g. Brian_Kipchumba_BirthCert_2026.pdf"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              {/* Upload Drag/Drop Box */}
              <div className="p-6 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/40 text-center space-y-2">
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto" />
                <div className="text-xs font-bold text-slate-800">
                  Simulate Document File Attachment
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepts PDF, JPG, PNG scanned certificates up to 15MB
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Any details to help administrative verification..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSubmittingRequestId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulatingUpload}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isSimulatingUpload ? 'Uploading...' : 'Submit Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
