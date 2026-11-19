import React, { useState } from 'react';
import { 
  FileText, 
  Bell, 
  ShieldCheck, 
  Settings, 
  History, 
  Printer, 
  CheckCircle2, 
  Send,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { 
  LibraryPolicy, 
  LibraryAuditLog, 
  LibraryBook, 
  LibraryBorrowRecord 
} from '../../types';
import { LibraryPortalSection } from './types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface GovernanceViewsProps {
  section: LibraryPortalSection;
  policies: LibraryPolicy[];
  auditLogs: LibraryAuditLog[];
  books: LibraryBook[];
  borrowRecords: LibraryBorrowRecord[];
  onAddPolicy?: (policy: LibraryPolicy) => void;
  onUpdatePolicy: (id: string, updates: Partial<LibraryPolicy>) => void;
  onDeletePolicy?: (id: string) => void;
  onAddAuditLog: (log: LibraryAuditLog) => void;
}

export const GovernanceViews: React.FC<GovernanceViewsProps> = ({
  section,
  policies,
  auditLogs,
  books,
  borrowRecords,
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy,
  onAddAuditLog
}) => {
  const [govNotice, setGovNotice] = useState<string | null>(null);
  const [broadcastAudience, setBroadcastAudience] = useState('All Students & Faculty');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Policy Add/Edit Modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [polName, setPolName] = useState('');
  const [polCategory, setPolCategory] = useState<LibraryPolicy['category']>('Lending');
  const [polValue, setPolValue] = useState('');
  const [polDescription, setPolDescription] = useState('');
  const [confirmDeletePolicyId, setConfirmDeletePolicyId] = useState<string | null>(null);

  const openAddPolicyModal = () => {
    setEditingPolicyId(null);
    setPolName('');
    setPolCategory('Lending');
    setPolValue('');
    setPolDescription('');
    setShowPolicyModal(true);
  };

  const openEditPolicyModal = (pol: LibraryPolicy) => {
    setEditingPolicyId(pol.id);
    setPolName(pol.policyName);
    setPolCategory(pol.category);
    setPolValue(pol.value);
    setPolDescription(pol.description);
    setShowPolicyModal(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!polName.trim() || !polValue.trim()) return;
    if (editingPolicyId) {
      onUpdatePolicy(editingPolicyId, {
        policyName: polName.trim(),
        category: polCategory,
        value: polValue.trim(),
        description: polDescription.trim()
      });
      setGovNotice(`Policy "${polName.trim()}" updated successfully.`);
    } else if (onAddPolicy) {
      onAddPolicy({
        id: `pol-${Date.now()}`,
        policyName: polName.trim(),
        category: polCategory,
        value: polValue.trim(),
        description: polDescription.trim()
      });
      setGovNotice(`New policy "${polName.trim()}" added successfully.`);
    }
    setShowPolicyModal(false);
    setEditingPolicyId(null);
  };
  // Reports & Analytics
  if (section === 'reports_analytics') {
    const totalBorrowed = borrowRecords.length;
    const activeLoans = borrowRecords.filter(r => r.status === 'active').length;
    const overdueCount = borrowRecords.filter(r => r.status === 'overdue').length;

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Library Analytics, Circulation Reports & MOE Audits</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Curriculum book ratios, borrowing trends by grade, and official institutional inventory reports.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Digest (PDF)</span>
          </button>
        </div>

        {/* Paper Report Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-8 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b-2 border-purple-900 pb-4">
            <EduSmartGadsaLogo variant="full" size="md" />
            <div className="text-right">
              <div className="text-xs font-black text-purple-950 uppercase tracking-wider">
                EduSmart Academy · Library Services
              </div>
              <div className="text-[11px] font-semibold text-slate-600">
                Term 3 Institutional Circulation & Asset Digest
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Generated: 2026-10-04 · Official Archival Record
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Titles</span>
              <div className="text-xl font-black text-slate-900 mt-1">{books.length}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Volumes</span>
              <div className="text-xl font-black text-purple-700 mt-1">
                {books.reduce((acc, b) => acc + b.totalCopies, 0)}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Circulation Loans</span>
              <div className="text-xl font-black text-blue-700 mt-1">{totalBorrowed}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Overdue Rate</span>
              <div className="text-xl font-black text-rose-600 mt-1">
                {totalBorrowed > 0 ? Math.round((overdueCount / totalBorrowed) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Breakdown by Category */}
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-700 border-b pb-1 mb-2">
              Curriculum Title Holdings Summary
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>CBC Primary Textbooks (Grades 1-6)</span>
                <span className="font-mono font-bold">420 Volumes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Junior Secondary Course Guides (Grades 7-9)</span>
                <span className="font-mono font-bold">310 Volumes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>African Literature & Supplementary Readers</span>
                <span className="font-mono font-bold">285 Volumes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Reference & General Encyclopedias</span>
                <span className="font-mono font-bold">115 Volumes</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="font-bold text-slate-900">Mrs. Jane Wambua, MLS</div>
              <div className="text-[10px] text-slate-500">School Librarian & Information Specialist</div>
            </div>
            <div>
              <div className="font-bold text-slate-900">Dr. Arthur Mwangi, PhD</div>
              <div className="text-[10px] text-slate-500">Head Teacher & Institutional Custodian</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Notifications
  if (section === 'notifications') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <span>Automated Library Dispatch & Parent Notifications</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Automated alerts triggered for due-date warnings, reserved hold pick-ups, and fine balances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Configured System Triggers</h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Pre-Due Reminder (48 hrs prior)</div>
                  <div className="text-slate-500">SMS to learner / parent informing due date.</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Overdue Recall Notice (Day +1, Day +7)</div>
                  <div className="text-slate-500">Automated portal alert and parent SMS dispatch.</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Reservation Arrival Alert</div>
                  <div className="text-slate-500">Notifies borrower when reserved hold is ready.</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Broadcast General Announcement</h4>
            {govNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {govNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setGovNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option>All Students & Faculty</option>
                  <option>Grade 4 to 6 Learners Only</option>
                  <option>Junior Secondary (Grades 7-9)</option>
                  <option>Faculty Only</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Notice</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Library will remain open until 5:30 PM for midterm exam revision..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const summary = broadcastMessage.trim() || 'General library schedule notice';
                  onAddAuditLog({
                    id: `aud-${Date.now()}`,
                    action: 'Library Broadcast Dispatched',
                    performedBy: 'Library Desk',
                    role: 'librarian',
                    timestamp: new Date().toISOString(),
                    details: `Sent announcement to ${broadcastAudience}: "${summary}"`
                  });
                  setBroadcastMessage('');
                  setGovNotice(`Broadcast announcement dispatched to ${broadcastAudience}.`);
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Broadcast Alert</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Policies
  if (section === 'policies') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Library Circulation Policies & Borrowing Rules</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Governing rules managed by the Librarian regarding loan periods, renewals, conduct, acquisitions, and fines.
            </p>
          </div>

          {onAddPolicy && (
            <button
              type="button"
              onClick={openAddPolicyModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Library Policy</span>
            </button>
          )}
        </div>

        {govNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {govNotice}
            </span>
            <button
              type="button"
              onClick={() => setGovNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {policies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
            No library policies configured yet. Click "Add Library Policy" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((pol) => (
              <div key={pol.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 uppercase">
                      {pol.category}
                    </span>
                    <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {pol.value}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 mt-2">{pol.policyName}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{pol.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-emerald-700 font-bold text-[11px]">Enforced in System</span>
                  <div className="flex items-center gap-1.5">
                    {confirmDeletePolicyId === pol.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onDeletePolicy?.(pol.id);
                            setConfirmDeletePolicyId(null);
                            setGovNotice(`Policy "${pol.policyName}" removed.`);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePolicyId(null)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditPolicyModal(pol)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {onDeletePolicy && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePolicyId(pol.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Policy Modal */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <h4 className="font-black text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{editingPolicyId ? 'Edit Library Policy' : 'Add New Library Policy'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePolicy} className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Policy Title *</label>
                  <input
                    type="text"
                    required
                    value={polName}
                    onChange={(e) => setPolName(e.target.value)}
                    placeholder="e.g. Maximum Student Loan Duration"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                    <select
                      value={polCategory}
                      onChange={(e) => setPolCategory(e.target.value as LibraryPolicy['category'])}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      <option value="Lending">Lending</option>
                      <option value="Fines">Fines</option>
                      <option value="Conduct">Conduct</option>
                      <option value="Acquisitions">Acquisitions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rule Value / Limit *</label>
                    <input
                      type="text"
                      required
                      value={polValue}
                      onChange={(e) => setPolValue(e.target.value)}
                      placeholder="e.g. 14 Days / KES 10/day"
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Policy Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={polDescription}
                    onChange={(e) => setPolDescription(e.target.value)}
                    placeholder="Detailed rule guidance enforced across the library..."
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(false)}
                    className="px-3 py-1.5 text-slate-600 font-bold hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg shadow-xs cursor-pointer"
                  >
                    {editingPolicyId ? 'Save Changes' : 'Create Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Settings
  if (section === 'settings') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>Library Portal System Configuration</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Barcode reader symbology, OPAC public visibility, and automated reminder schedules.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 max-w-xl text-xs">
          {govNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {govNotice}
              </span>
              <button
                type="button"
                onClick={() => setGovNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-bold text-slate-900">Enable Barcode / QR Scanner Mode</div>
                <div className="text-slate-500">Auto-focus input for USB laser barcode scanners.</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-bold text-slate-900">Student Self-Service Hold Placement</div>
                <div className="text-slate-500">Allow students to reserve checked-out titles directly.</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-bold text-slate-900">Automatic Overdue Fine Accrual</div>
                <div className="text-slate-500">Daily KES 10 fee calculation at 00:00 midnight.</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onAddAuditLog({
                  id: `aud-${Date.now()}`,
                  action: 'Library Settings Updated',
                  performedBy: 'Library Desk',
                  role: 'librarian',
                  timestamp: new Date().toISOString(),
                  details: 'Saved library portal operational configuration.'
                });
                setGovNotice('Library settings successfully saved.');
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Audit Trail
  if (section === 'audit_trail') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <span>Library Circulation & Cataloguing Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction history of all checkouts, returns, fine waivers, and new book accessions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 font-mono text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.action}</td>
                  <td className="py-3.5 px-4 text-purple-800 font-semibold">{log.performedBy}</td>
                  <td className="py-3.5 px-4 text-slate-600">{log.details}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-right">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
