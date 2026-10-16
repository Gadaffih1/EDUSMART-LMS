import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Printer, 
  Download, 
  Building2, 
  Search, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Send,
  Eye,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import { OperationsStorage } from '../../utils/operationsStorage';
import { 
  HREmployee, 
  MonthlyPayrollRun, 
  IndividualPayslip,
  EmploymentType,
  calculateKenyanPayrollDeductions
} from '../../types/financeOperations';
import { User } from '../../types';
import { useTenant } from '../../context/TenantContext';

interface HRPayrollPortalViewProps {
  currentUser: User;
}

export const HRPayrollPortalView: React.FC<HRPayrollPortalViewProps> = ({
  currentUser
}) => {
  const { currentTenant } = useTenant();
  const [subTab, setSubTab] = useState<'employees' | 'payroll_runs' | 'payslips' | 'statutory'>('employees');

  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<MonthlyPayrollRun[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<IndividualPayslip | null>(null);

  // Modals
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // New Employee Form
  const [empName, setEmpName] = useState('');
  const [empNumber, setEmpNumber] = useState('');
  const [empNationalId, setEmpNationalId] = useState('');
  const [empTscNumber, setEmpTscNumber] = useState('');
  const [empKraPin, setEmpKraPin] = useState('');
  const [empDepartment, setEmpDepartment] = useState('Science & Mathematics Faculty');
  const [empDesignation, setEmpDesignation] = useState('Subject Teacher');
  const [empType, setEmpType] = useState<EmploymentType>('Permanent & Pensionable');
  const [empBasic, setEmpBasic] = useState(70000);
  const [empHouse, setEmpHouse] = useState(18000);
  const [empCommuter, setEmpCommuter] = useState(6000);
  const [empResponsibility, setEmpResponsibility] = useState(5000);
  const [empBankName, setEmpBankName] = useState('KCB Bank Kenya');
  const [empBankAccount, setEmpBankAccount] = useState('');

  // Payroll Run Form
  const [payrollMonth, setPayrollMonth] = useState('March 2026');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setEmployees(OperationsStorage.getEmployees(currentTenant.id));
    setPayrollRuns(OperationsStorage.getPayrollRuns(currentTenant.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('hr-updated', handleUpdate);
    return () => window.removeEventListener('hr-updated', handleUpdate);
  }, [currentTenant.id]);

  const activeEmployees = employees.filter(e => e.status === 'Active');
  const totalMonthlyGross = activeEmployees.reduce((acc, curr) => acc + curr.grossPay, 0);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.tscNumber && emp.tscNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDepartment === 'all' || emp.department === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empKraPin.trim()) {
      alert('Employee Name and KRA PIN are mandatory.');
      return;
    }

    const gross = Number(empBasic) + Number(empHouse) + Number(empCommuter) + Number(empResponsibility);

    const created = OperationsStorage.addEmployee({
      tenantId: currentTenant.id,
      employeeNumber: empNumber || `EMP-RS-${Math.floor(100 + Math.random() * 900)}`,
      name: empName,
      nationalId: empNationalId || '28391029',
      tscNumber: empTscNumber || undefined,
      kraPin: empKraPin.toUpperCase(),
      nssfNumber: '1102938491',
      nhifShifNumber: '9201928391',
      department: empDepartment,
      designation: empDesignation,
      employmentType: empType,
      dateOfJoining: new Date().toISOString().split('T')[0],
      email: `${empName.toLowerCase().replace(/[^a-z]/g, '.')}@edusmart.ac.ke`,
      phone: '+254 700 000 000',
      bankName: empBankName,
      bankAccount: empBankAccount || '110293847192',
      bankBranch: 'Nairobi Main Branch',
      basicSalary: Number(empBasic),
      houseAllowance: Number(empHouse),
      commuterAllowance: Number(empCommuter),
      hardshipAllowance: 0,
      responsibilityAllowance: Number(empResponsibility),
      grossPay: gross,
      status: 'Active'
    });

    setShowAddEmpModal(false);
    setEmpName('');
    setEmpKraPin('');
    loadData();
    setToastMessage(`Employee ${created.name} (${created.employeeNumber}) added to HR Master!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const result = OperationsStorage.createMonthlyPayrollRun(
      payrollMonth,
      '2026',
      currentUser.name || 'Finance / HR Officer',
      currentTenant.id
    );

    setShowRunPayrollModal(false);
    loadData();
    setToastMessage(`Payroll Run ${result.run.runNumber} for ${payrollMonth} compiled! Awaiting Head Teacher executive sign-off.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprovePayroll = (runId: string) => {
    const updated = OperationsStorage.approvePayrollRun(runId, currentUser.name || 'Head Teacher Patrick Kamau');
    if (updated) {
      loadData();
      setToastMessage(`Payroll Run ${updated.runNumber} approved! Bank batch disbursement schedule posted to General Ledger.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-purple-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Users className="w-5 h-5 text-purple-400" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-white">
              HR & Payroll Management Portal
            </h2>
            <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Kenyan CBC Statutory Engine
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Faculty dossiers with TSC validation, automated statutory deductions (PAYE, NSSF Tier I & II, NHIF/SHIF, Housing Levy 1.5%), payroll runs, and digital payslips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRunPayrollModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white transition-all shadow-lg shadow-purple-950/40 flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Process Monthly Payroll</span>
          </button>
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Employee</span>
          </button>
        </div>
      </div>

      {/* HR KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Employees</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {activeEmployees.length} Staff
          </div>
          <div className="text-[11px] text-slate-500">
            Teaching & support staff on institutional payroll
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Gross Pay</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            KES {totalMonthlyGross.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Basic + House + Commuter + Responsibility
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Statutory Deductions</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">
            4 Schemes
          </div>
          <div className="text-[11px] text-blue-600 font-medium">
            PAYE · NSSF Tier I/II · NHIF/SHIF · Housing Levy 1.5%
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Payroll Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Current
          </div>
          <div className="text-[11px] text-slate-500">
            GL Journal posted automatically upon approval
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSubTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'employees'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Faculty & Staff Master Directory ({employees.length})</span>
        </button>

        <button
          onClick={() => setSubTab('payroll_runs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'payroll_runs'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Monthly Payroll Runs ({payrollRuns.length})</span>
        </button>

        <button
          onClick={() => setSubTab('statutory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'statutory'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Kenya Statutory Tax Tables & Rules</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEE MASTER DIRECTORY */}
      {subTab === 'employees' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Employee Personnel Registry & Compensation Dossiers
              </h3>
              <p className="text-xs text-slate-500">
                Connected to school faculty allocations, TSC numbers, bank routing, and salary structures.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff, TSC or ID..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="all">All Departments</option>
                <option value="Executive Administration">Executive Administration</option>
                <option value="Science & Mathematics Faculty">Science & Mathematics</option>
                <option value="Languages & Humanities">Languages & Humanities</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Stores & Facilities Logistics">Stores & Logistics</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Emp #</th>
                  <th className="py-3 px-3">Staff Member</th>
                  <th className="py-3 px-3">Department & Role</th>
                  <th className="py-3 px-3">TSC / KRA PIN</th>
                  <th className="py-3 px-3">Basic Salary</th>
                  <th className="py-3 px-3">Allowances</th>
                  <th className="py-3 px-3">Gross Pay</th>
                  <th className="py-3 px-3">Bank Details</th>
                  <th className="py-3 px-3 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const allowances = emp.houseAllowance + emp.commuterAllowance + emp.responsibilityAllowance;
                  const calc = calculateKenyanPayrollDeductions(emp.grossPay);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {emp.employeeNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-950 font-serif">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {emp.nationalId} · {emp.employmentType}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{emp.designation}</div>
                        <div className="text-[10px] text-slate-500">{emp.department}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>{emp.tscNumber ? <strong className="text-blue-700">{emp.tscNumber}</strong> : <span className="text-slate-400">Non-TSC</span>}</div>
                        <div className="text-slate-500">PIN: {emp.kraPin}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800">
                        KES {emp.basicSalary.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        KES {allowances.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-slate-950">
                        KES {emp.grossPay.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        <div>{emp.bankName}</div>
                        <div className="font-mono text-[10px]">A/C: {emp.bankAccount}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedPayslip({
                              id: `slip-${emp.id}`,
                              payrollRunId: 'run-active',
                              tenantId: currentTenant.id,
                              employeeId: emp.id,
                              employeeName: emp.name,
                              employeeNumber: emp.employeeNumber,
                              kraPin: emp.kraPin,
                              month: 'Term 1, 2026',
                              academicYear: '2026',
                              basicSalary: emp.basicSalary,
                              houseAllowance: emp.houseAllowance,
                              commuterAllowance: emp.commuterAllowance,
                              responsibilityAllowance: emp.responsibilityAllowance,
                              grossEarnings: emp.grossPay,
                              payeTax: calc.paye,
                              nssfDeduction: calc.nssf,
                              nhifShifDeduction: calc.nhifShif,
                              housingLevyDeduction: calc.housingLevy,
                              otherDeductions: 0,
                              totalDeductions: calc.totalDeductions,
                              netPayable: calc.netPay,
                              disbursementStatus: 'Disbursed via Bank Batch'
                            });
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-lg text-xs font-bold transition-all border border-purple-200 cursor-pointer"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY PAYROLL RUNS */}
      {subTab === 'payroll_runs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Monthly Staff Payroll Processing History
              </h3>
              <p className="text-xs text-slate-500">
                Comprehensive statutory deductions and direct bank batch schedules with Head Teacher approvals.
              </p>
            </div>
            <button
              onClick={() => setShowRunPayrollModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compile New Payroll</span>
            </button>
          </div>

          <div className="space-y-4">
            {payrollRuns.map((run) => (
              <div key={run.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                        {run.runNumber}
                      </span>
                      <h4 className="font-bold text-base text-slate-950 font-serif">
                        {run.payrollMonth} ({run.academicYear})
                      </h4>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        run.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        run.status === 'Head Teacher Approved' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Staff on run: <strong>{run.totalEmployees} employees</strong> · Prepared By: {run.preparedBy}
                    </p>
                    {run.approvedBy && (
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        ✓ Executive sign-off by {run.approvedBy} on {run.approvalDate} (GL Voucher: {run.generalLedgerJournalId})
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Salary Disbursed</span>
                    <span className="font-mono text-xl font-black text-emerald-700">
                      KES {run.totalNetPay.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Gross: KES {run.totalGrossPay.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Statutory deductions breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">KRA PAYE Tax</span>
                    <span className="font-black text-slate-900">KES {run.totalPayeTax.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">NSSF Tier I & II</span>
                    <span className="font-black text-slate-900">KES {run.totalNssf.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">NHIF / SHIF</span>
                    <span className="font-black text-slate-900">KES {run.totalNhifShif.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Housing Levy 1.5%</span>
                    <span className="font-black text-slate-900">KES {run.totalHousingLevy.toLocaleString()}</span>
                  </div>
                </div>

                {/* Approval Action */}
                {run.status !== 'Disbursed' && (
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => handleApprovePayroll(run.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Executive Sign-Off & Disburse Bank Schedule</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STATUTORY TAX TABLES */}
      {subTab === 'statutory' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Kenyan CBC Statutory Payroll Rules & Deduction Brackets
            </h3>
            <p className="text-xs text-slate-500">
              Compliant with the Finance Act 2023/2024, Social Health Insurance Act (SHIF), and Affordable Housing Levy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">1. PAYE Individual Tax Brackets</h4>
              <ul className="space-y-1 text-slate-600 font-mono text-[11px]">
                <li>• First KES 24,000 per month: <strong>10.0%</strong></li>
                <li>• Next KES 8,333 per month: <strong>25.0%</strong></li>
                <li>• Next KES 467,667 per month: <strong>30.0%</strong></li>
                <li>• Above KES 500,000 per month: <strong>32.5%</strong></li>
                <li>• Monthly Personal Relief: <strong>KES 2,400.00</strong></li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">2. NSSF, SHIF & Housing Levy</h4>
              <ul className="space-y-1 text-slate-600 font-mono text-[11px]">
                <li>• NSSF Tier I: <strong>KES 420.00</strong> (Lower limit KES 7,000)</li>
                <li>• NSSF Tier II: <strong>KES 1,740.00</strong> (Upper limit KES 36,000)</li>
                <li>• Social Health Insurance (SHIF): <strong>2.75% of Gross Pay</strong></li>
                <li>• Affordable Housing Levy: <strong>1.5% of Gross Pay</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIGITAL PAYSLIP */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-sm text-slate-900 font-serif">Official Faculty Digital Payslip</h4>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="printable-report border border-slate-300 p-5 rounded-2xl bg-white space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                <div className="font-black text-sm font-serif uppercase tracking-tight text-slate-950">{currentTenant.name}</div>
                <div className="text-[10px] text-slate-500">Human Resources & Payroll Directorate</div>
                <div className="font-extrabold text-xs pt-1 text-purple-800">CONFIDENTIAL SALARY PAYSLIP</div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] py-1">
                <div><span className="text-slate-400">Employee:</span> <strong className="text-slate-900">{selectedPayslip.employeeName}</strong></div>
                <div><span className="text-slate-400">Emp No:</span> <strong className="text-slate-900">{selectedPayslip.employeeNumber}</strong></div>
                <div><span className="text-slate-400">KRA PIN:</span> <strong className="text-slate-900">{selectedPayslip.kraPin}</strong></div>
                <div><span className="text-slate-400">Period:</span> <strong className="text-slate-900">{selectedPayslip.month}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-200">
                {/* Earnings */}
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 uppercase text-[10px] pb-1 border-b border-slate-100">Earnings</div>
                  <div className="flex justify-between"><span>Basic Salary:</span> <strong>KES {selectedPayslip.basicSalary.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>House Allowance:</span> <strong>KES {selectedPayslip.houseAllowance.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>Commuter:</span> <strong>KES {selectedPayslip.commuterAllowance.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>Responsibility:</span> <strong>KES {selectedPayslip.responsibilityAllowance.toLocaleString()}</strong></div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-950">
                    <span>GROSS PAY:</span> <strong>KES {selectedPayslip.grossEarnings.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 uppercase text-[10px] pb-1 border-b border-slate-100">Statutory Deductions</div>
                  <div className="flex justify-between"><span>KRA PAYE Tax:</span> <strong>KES {selectedPayslip.payeTax.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>NSSF Tier I & II:</span> <strong>KES {selectedPayslip.nssfDeduction.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>NHIF / SHIF:</span> <strong>KES {selectedPayslip.nhifShifDeduction.toLocaleString()}</strong></div>
                  <div className="flex justify-between"><span>Housing Levy (1.5%):</span> <strong>KES {selectedPayslip.housingLevyDeduction.toLocaleString()}</strong></div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-rose-700">
                    <span>TOTAL DEDUCT:</span> <strong>KES {selectedPayslip.totalDeductions.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-900 text-sm">NET TAKE-HOME PAY:</span>
                <span className="text-base font-black text-emerald-800 font-mono">KES {selectedPayslip.netPayable.toLocaleString()}</span>
              </div>

              <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-dashed border-slate-300">
                Disbursement Status: <strong>{selectedPayslip.disbursementStatus}</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Payslip</span>
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RUN MONTHLY PAYROLL */}
      {showRunPayrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Run Monthly Staff Payroll</h3>
              </div>
              <button onClick={() => setShowRunPayrollModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunPayroll} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payroll Calendar Month *</label>
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="March 2026">March 2026 (Active Term 1)</option>
                  <option value="April 2026">April 2026 (Holiday Roster)</option>
                  <option value="May 2026">May 2026 (Term 2 Commencement)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                <div className="font-bold text-purple-900">Pre-Run Summary:</div>
                <div className="flex justify-between text-purple-800">
                  <span>Enrolled Faculty & Staff:</span>
                  <strong>{activeEmployees.length} Employees</strong>
                </div>
                <div className="flex justify-between text-purple-800">
                  <span>Estimated Total Gross:</span>
                  <strong>KES {totalMonthlyGross.toLocaleString()}</strong>
                </div>
                <p className="text-[11px] text-purple-700 pt-1">
                  Automated computation of PAYE, NSSF, SHIF and Housing Levy will execute for each employee.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRunPayrollModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Execute Monthly Payroll</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL NEW EMPLOYEE */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Enroll Faculty / Staff Member</h3>
              </div>
              <button onClick={() => setShowAddEmpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Mr. Samuel Kariuki"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Employee Number</label>
                  <input
                    type="text"
                    value={empNumber}
                    onChange={(e) => setEmpNumber(e.target.value)}
                    placeholder="EMP-RS-008"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">National ID</label>
                  <input
                    type="text"
                    value={empNationalId}
                    onChange={(e) => setEmpNationalId(e.target.value)}
                    placeholder="29810293"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">TSC Number (If Teacher)</label>
                  <input
                    type="text"
                    value={empTscNumber}
                    onChange={(e) => setEmpTscNumber(e.target.value)}
                    placeholder="TSC/..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">KRA PIN *</label>
                  <input
                    type="text"
                    value={empKraPin}
                    onChange={(e) => setEmpKraPin(e.target.value)}
                    placeholder="A00..."
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Science & Mathematics Faculty">Science & Mathematics</option>
                    <option value="Languages & Humanities">Languages & Humanities</option>
                    <option value="Co-Curricular & Sports Academy">Sports Academy</option>
                    <option value="School Fleet & Transport">Transport & Fleet</option>
                    <option value="Catering & Dining Kitchen">Kitchen Staff</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    placeholder="e.g. Mathematics Faculty"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Basic Salary (KES) *</label>
                  <input
                    type="number"
                    value={empBasic}
                    onChange={(e) => setEmpBasic(Number(e.target.value))}
                    min={15000}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">House Allowance</label>
                  <input
                    type="number"
                    value={empHouse}
                    onChange={(e) => setEmpHouse(Number(e.target.value))}
                    min={0}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enroll Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
