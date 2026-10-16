import {
  FeeStructureItem,
  FeeInvoice,
  FeePaymentReceipt,
  GeneralLedgerAccount,
  BudgetAllocation,
  VendorSupplier,
  PurchaseRequisition,
  PurchaseOrderLPO,
  StoreInventoryItem,
  GoodsReceivedNoteGRN,
  StoreIssueVoucher,
  StocktakeAuditRecord,
  HREmployee,
  MonthlyPayrollRun,
  IndividualPayslip,
  OperationsAuditLog
} from '../types/financeOperations';

export const INITIAL_FEE_STRUCTURES: FeeStructureItem[] = [
  {
    id: 'fee-1',
    name: 'Primary Tuition & Instruction Fee',
    amount: 38000,
    gradeLevel: 'Grades 1-6',
    frequency: 'Termly',
    isOptional: false,
    category: 'Tuition'
  },
  {
    id: 'fee-2',
    name: 'Junior School Core Academic Tuition',
    amount: 48000,
    gradeLevel: 'Grades 7-9',
    frequency: 'Termly',
    isOptional: false,
    category: 'Tuition'
  },
  {
    id: 'fee-3',
    name: 'Integrated Science & ICT STEM Lab Levy',
    amount: 6500,
    gradeLevel: 'Grades 7-9',
    frequency: 'Termly',
    isOptional: false,
    category: 'STEM & ICT'
  },
  {
    id: 'fee-4',
    name: 'Nutritious Hot Lunch & Dining Program',
    amount: 11000,
    gradeLevel: 'Grades 1-9',
    frequency: 'Termly',
    isOptional: false,
    category: 'Lunch & Dining'
  },
  {
    id: 'fee-5',
    name: 'Swimming & Co-Curricular Academy',
    amount: 5000,
    gradeLevel: 'Grades 1-9',
    frequency: 'Termly',
    isOptional: true,
    category: 'Activity & Sports'
  },
  {
    id: 'fee-6',
    name: 'Daily School Bus Doorstep Transport (Zone 1)',
    amount: 14500,
    gradeLevel: 'Grades 1-9',
    frequency: 'Termly',
    isOptional: true,
    category: 'Transport'
  }
];

export const INITIAL_GL_ACCOUNTS: GeneralLedgerAccount[] = [
  { code: '1010', name: 'Main Operations Bank Account (KCB)', category: 'Asset', balance: 18450200, currency: 'KES', description: 'Primary institutional operational account for fee collections and disbursements' },
  { code: '1020', name: 'Safaricom M-PESA Paybill 522123 Clearing', category: 'Asset', balance: 2145800, currency: 'KES', description: 'Real-time parent fee mobile collections awaiting daily automated sweep' },
  { code: '1050', name: 'Central Stores Inventory Asset Value', category: 'Asset', balance: 3420000, currency: 'KES', description: 'Total capital value of current physical inventory in stock' },
  { code: '2010', name: 'Accounts Payable (Trade Creditors)', category: 'Liability', balance: 1840000, currency: 'KES', description: 'Outstanding pending supplier invoices awaiting net 30 day disbursement' },
  { code: '2030', name: 'Statutory Payroll Deductions Payable (KRA, NSSF, SHIF)', category: 'Liability', balance: 940000, currency: 'KES', description: 'Employee PAYE, NSSF, Housing Levy withheld awaiting 9th of next month remittance' },
  { code: '3010', name: 'School Termly Tuition Revenue', category: 'Revenue', balance: 46250000, currency: 'KES', description: 'Accumulated termly academic tuition collections' },
  { code: '3020', name: 'Lunch, Dining & Boarding Revenue', category: 'Revenue', balance: 12400000, currency: 'KES', description: 'Catering and boarding auxiliary revenue stream' },
  { code: '4010', name: 'Teaching Faculty Salaries & Allowances', category: 'Expense', balance: 21850000, currency: 'KES', description: 'Monthly instructional staff compensation' },
  { code: '4020', name: 'Learning Materials, Laboratory & STEM', category: 'Expense', balance: 4620000, currency: 'KES', description: 'Classroom books, science specimens, stationery, coding resources' },
  { code: '4030', name: 'Fleet Fuel & Bus Maintenance Expenses', category: 'Expense', balance: 2850000, currency: 'KES', description: 'Vehicle servicing, diesel fuel, insurance inspection' }
];

export const INITIAL_BUDGETS: BudgetAllocation[] = [
  { id: 'bgt-1', tenantId: 'tenant-riara', department: 'Academics & CBC Curriculum', fiscalYear: '2026', allocatedAmount: 5200000, committedAmount: 950000, spentAmount: 2850000, remainingAmount: 1400000, leadOfficer: 'Mr. Patrick Kamau' },
  { id: 'bgt-2', tenantId: 'tenant-riara', department: 'Science Laboratory & STEM', fiscalYear: '2026', allocatedAmount: 3100000, committedAmount: 480000, spentAmount: 1650000, remainingAmount: 970000, leadOfficer: 'Mrs. Lydia Muthoni' },
  { id: 'bgt-3', tenantId: 'tenant-riara', department: 'Sports, Clubs & Co-Curricular', fiscalYear: '2026', allocatedAmount: 2200000, committedAmount: 320000, spentAmount: 1100000, remainingAmount: 780000, leadOfficer: 'Coach Daniel Kimani' },
  { id: 'bgt-4', tenantId: 'tenant-riara', department: 'School Fleet & Transport', fiscalYear: '2026', allocatedAmount: 4500000, committedAmount: 650000, spentAmount: 2450000, remainingAmount: 1400000, leadOfficer: 'Mr. Francis Mwangi' },
  { id: 'bgt-5', tenantId: 'tenant-riara', department: 'Facilities, Security & Hygiene', fiscalYear: '2026', allocatedAmount: 2800000, committedAmount: 420000, spentAmount: 1450000, remainingAmount: 930000, leadOfficer: 'Mr. Joseph Otieno' }
];

export const INITIAL_SUPPLIERS: VendorSupplier[] = [
  {
    id: 'sup-1',
    tenantId: 'tenant-riara',
    name: 'Text Book Centre Ltd',
    kraPin: 'P051123456Z',
    taxComplianceValid: true,
    category: 'Textbooks & Stationery',
    contactPerson: 'Mr. Ramesh Shah',
    phone: '+254 722 203 400',
    email: 'corporate@tbc.co.ke',
    address: 'Kijabe Street / Sarit Centre, Nairobi',
    bankName: 'Standard Chartered Bank',
    bankAccount: '010204992100',
    rating: 5,
    status: 'Approved'
  },
  {
    id: 'sup-2',
    tenantId: 'tenant-riara',
    name: 'Chemlab Kenya East Africa Ltd',
    kraPin: 'P051987654A',
    taxComplianceValid: true,
    category: 'Laboratory Chemicals & Apparatus',
    contactPerson: 'Dr. Kennedy Oduor',
    phone: '+254 733 992 110',
    email: 'orders@chemlab-ea.com',
    address: 'Industrial Area, Enterprise Road, Nairobi',
    bankName: 'Equity Bank Kenya',
    bankAccount: '0810293847291',
    rating: 5,
    status: 'Approved'
  },
  {
    id: 'sup-3',
    tenantId: 'tenant-riara',
    name: 'Nairobi Sports House & Apparel',
    kraPin: 'P051445566B',
    taxComplianceValid: true,
    category: 'Sports Gear & Trophies',
    contactPerson: 'Ms. Pauline Muthoni',
    phone: '+254 720 123 456',
    email: 'info@nairobisports.co.ke',
    address: 'Moi Avenue, Nairobi CBD',
    bankName: 'KCB Bank',
    bankAccount: '1102938472',
    rating: 4,
    status: 'Approved'
  },
  {
    id: 'sup-4',
    tenantId: 'tenant-riara',
    name: 'Bidco Africa Institutional Food Division',
    kraPin: 'P051778899C',
    taxComplianceValid: true,
    category: 'Food Supplies & Kitchen Provisions',
    contactPerson: 'Mr. Hassan Noor',
    phone: '+254 711 445 566',
    email: 'institutions@bidco-group.com',
    address: 'Thika Superhighway, Ruiru Industrial Hub',
    bankName: 'Cooperative Bank of Kenya',
    bankAccount: '01129384719200',
    rating: 5,
    status: 'Approved'
  }
];

export const INITIAL_REQUISITIONS: PurchaseRequisition[] = [
  {
    id: 'req-1',
    reqNumber: 'REQ-2026-0042',
    tenantId: 'tenant-riara',
    department: 'Science Laboratory & STEM',
    requestedBy: 'Mrs. Lydia Muthoni',
    requesterRole: 'Senior Science Teacher',
    requestDate: '2026-03-05',
    requiredDate: '2026-03-18',
    priority: 'High',
    justification: 'Critical biological specimens, microscopic glass slides, and diluted acids needed for Grade 8 Term 1 KNEC formative CBA experiments.',
    items: [
      { id: 'item-1', description: 'Compound Optical Microscopes (1000x)', specification: 'Monocular with LED illumination & mechanical stage', quantity: 4, unit: 'Units', estimatedUnitCost: 18500, estimatedTotal: 74000 },
      { id: 'item-2', description: 'Pre-prepared Plant Tissue Slides (Set of 50)', specification: 'KICD approved plant stem, leaf, and root cross sections', quantity: 5, unit: 'Sets', estimatedUnitCost: 4500, estimatedTotal: 22500 },
      { id: 'item-3', description: 'Dilute Hydrochloric Acid (0.1M, 2.5L)', specification: 'Analytical grade laboratory bottle', quantity: 6, unit: 'Bottles', estimatedUnitCost: 2800, estimatedTotal: 16800 }
    ],
    totalEstimatedCost: 113300,
    status: 'Head Teacher Approved',
    approvalChain: [
      { role: 'Head of Department', approverName: 'Mr. James Ochieng', approvedAt: '2026-03-06 09:15', status: 'Approved', comments: 'Essential for Junior School CBC curriculum delivery.' },
      { role: 'Finance / Bursar', approverName: 'Mr. David Mwangi', approvedAt: '2026-03-07 11:30', status: 'Approved', comments: 'Budget available under Science Lab allocation (Code 4020).' },
      { role: 'Head Teacher', approverName: 'Mr. Patrick Kamau', approvedAt: '2026-03-08 14:00', status: 'Approved', comments: 'Approved for immediate Local Purchase Order issuance.' }
    ]
  },
  {
    id: 'req-2',
    reqNumber: 'REQ-2026-0043',
    tenantId: 'tenant-riara',
    department: 'Sports, Clubs & Co-Curricular',
    requestedBy: 'Coach Daniel Kimani',
    requesterRole: 'Head of Athletics & Football',
    requestDate: '2026-03-10',
    requiredDate: '2026-03-24',
    priority: 'Medium',
    justification: 'Replacement footballs, referee whistles, agility cones, and first-aid stretcher for Sub-County inter-school tournament.',
    items: [
      { id: 'item-4', description: 'Mitre Match Size 5 Footballs', specification: 'FIFA Quality Pro certified match balls', quantity: 12, unit: 'Balls', estimatedUnitCost: 3500, estimatedTotal: 42000 },
      { id: 'item-5', description: 'Heavy Duty Training Agility Cones', specification: 'Set of 40 multi-color 9-inch cones', quantity: 4, unit: 'Sets', estimatedUnitCost: 2400, estimatedTotal: 9600 }
    ],
    totalEstimatedCost: 51600,
    status: 'LPO Created',
    approvalChain: [
      { role: 'Head of Department', approverName: 'Coach Daniel Kimani', approvedAt: '2026-03-10 14:10', status: 'Approved' },
      { role: 'Finance / Bursar', approverName: 'Mr. David Mwangi', approvedAt: '2026-03-11 10:20', status: 'Approved' },
      { role: 'Head Teacher', approverName: 'Mr. Patrick Kamau', approvedAt: '2026-03-11 16:45', status: 'Approved' }
    ]
  }
];

export const INITIAL_LPOS: PurchaseOrderLPO[] = [
  {
    id: 'lpo-1',
    lpoNumber: 'LPO-2026-0088',
    tenantId: 'tenant-riara',
    requisitionId: 'req-1',
    vendorId: 'sup-2',
    vendorName: 'Chemlab Kenya East Africa Ltd',
    vendorPhone: '+254 733 992 110',
    orderDate: '2026-03-09',
    deliveryDueDate: '2026-03-22',
    items: [
      { description: 'Compound Optical Microscopes (1000x)', quantity: 4, unit: 'Units', unitPrice: 18500, totalPrice: 74000 },
      { description: 'Pre-prepared Plant Tissue Slides (Set of 50)', quantity: 5, unit: 'Sets', unitPrice: 4500, totalPrice: 22500 },
      { description: 'Dilute Hydrochloric Acid (0.1M, 2.5L)', quantity: 6, unit: 'Bottles', unitPrice: 2800, totalPrice: 16800 }
    ],
    subtotal: 113300,
    taxVat: 18128,
    totalAmount: 131428,
    paymentTerms: '30 Days Net after Inspection & Goods Received Note',
    deliveryLocation: 'Riara Junior School Science Laboratory Block B',
    authorizedBy: 'Mr. Patrick Kamau (Principal)',
    status: 'Issued'
  }
];

export const INITIAL_INVENTORY: StoreInventoryItem[] = [
  { id: 'inv-1', itemCode: 'STN-PPR-01', tenantId: 'tenant-riara', name: 'A4 White Ruled Printing Paper (80gsm)', category: 'Classroom Stationery', storeLocation: 'Main Central Store', unit: 'Reams', currentStock: 240, reorderLevel: 50, unitCost: 680, totalValue: 163200, lastRestockedDate: '2026-02-15', supplierName: 'Text Book Centre Ltd' },
  { id: 'inv-2', itemCode: 'STN-FOL-02', tenantId: 'tenant-riara', name: 'CBC Learner Formative Assessment Portfolios', category: 'Classroom Stationery', storeLocation: 'Main Central Store', unit: 'Pcs', currentStock: 420, reorderLevel: 100, unitCost: 260, totalValue: 109200, lastRestockedDate: '2026-02-20', supplierName: 'Text Book Centre Ltd' },
  { id: 'inv-3', itemCode: 'LAB-MIC-03', tenantId: 'tenant-riara', name: 'Monocular Student Compound Microscope 1000x', category: 'Science Lab Reagents & Apparatus', storeLocation: 'Science Laboratory Store', unit: 'Units', currentStock: 18, reorderLevel: 5, unitCost: 18500, totalValue: 333000, lastRestockedDate: '2026-01-10', supplierName: 'Chemlab Kenya East Africa Ltd' },
  { id: 'inv-4', itemCode: 'LAB-ACD-04', tenantId: 'tenant-riara', name: 'Dilute Hydrochloric Acid 0.1M (2.5L Container)', category: 'Science Lab Reagents & Apparatus', storeLocation: 'Science Laboratory Store', unit: 'Bottles', currentStock: 14, reorderLevel: 6, unitCost: 2800, totalValue: 39200, lastRestockedDate: '2026-02-05', supplierName: 'Chemlab Kenya East Africa Ltd' },
  { id: 'inv-5', itemCode: 'SPT-BAL-05', tenantId: 'tenant-riara', name: 'Mitre Match Size 5 Footballs (FIFA Approved)', category: 'Sports & Athletics Equipment', storeLocation: 'Sports Equipment Shed', unit: 'Balls', currentStock: 28, reorderLevel: 10, unitCost: 3500, totalValue: 98000, lastRestockedDate: '2026-02-12', supplierName: 'Nairobi Sports House & Apparel' },
  { id: 'inv-6', itemCode: 'UNI-BLZ-06', tenantId: 'tenant-riara', name: 'Junior School Embroidered Navy Blazer (Size 34-38)', category: 'Uniforms & Apparel', storeLocation: 'Main Central Store', unit: 'Pcs', currentStock: 85, reorderLevel: 25, unitCost: 3800, totalValue: 323000, lastRestockedDate: '2026-01-28', supplierName: 'Nairobi Sports House & Apparel' },
  { id: 'inv-7', itemCode: 'KIT-RIC-07', tenantId: 'tenant-riara', name: 'Pure Mwea Pishori Rice Grade 1 (50Kg Sack)', category: 'Kitchen Dry Provisions', storeLocation: 'Kitchen Pantry Store', unit: 'Sacks', currentStock: 45, reorderLevel: 15, unitCost: 8200, totalValue: 369000, lastRestockedDate: '2026-03-01', supplierName: 'Bidco Africa Institutional Food Division' }
];

export const INITIAL_GRNS: GoodsReceivedNoteGRN[] = [
  {
    id: 'grn-1',
    grnNumber: 'GRN-2026-0104',
    tenantId: 'tenant-riara',
    lpoId: 'lpo-1',
    lpoNumber: 'LPO-2026-0088',
    vendorName: 'Chemlab Kenya East Africa Ltd',
    deliveryNoteNumber: 'DN-89201',
    receivedDate: '2026-03-12',
    receivedBy: 'Mr. Joseph Otieno (Storekeeper)',
    inspectedBy: 'Mrs. Lydia Muthoni (Senior Science Teacher)',
    inspectionPassed: true,
    itemsReceived: [
      { itemId: 'inv-3', itemName: 'Monocular Student Compound Microscope 1000x', orderedQty: 4, receivedQty: 4, acceptedQty: 4, rejectedQty: 0, unitCost: 18500 },
      { itemId: 'inv-4', itemName: 'Dilute Hydrochloric Acid 0.1M (2.5L Container)', orderedQty: 6, receivedQty: 6, acceptedQty: 6, rejectedQty: 0, unitCost: 2800 }
    ],
    totalAcceptedValue: 90800,
    remarks: 'Delivered in pristine condition with unbroken safety seals and calibration certificates.'
  }
];

export const INITIAL_SIVS: StoreIssueVoucher[] = [
  {
    id: 'siv-1',
    sivNumber: 'SIV-2026-0210',
    tenantId: 'tenant-riara',
    issueDate: '2026-03-13',
    issuedToName: 'Madame Alice Mutiso',
    issuedToRole: 'Grade 7 Mara Class Teacher',
    department: 'Junior School Languages & Humanities',
    purpose: 'Distribution of termly CBC formative assessment portfolio dossiers to 36 learners.',
    issuedBy: 'Mr. Joseph Otieno (Chief Storekeeper)',
    items: [
      { itemId: 'inv-2', itemName: 'CBC Learner Formative Assessment Portfolios', quantity: 36, unit: 'Pcs', unitCost: 260, totalCost: 9360 }
    ],
    totalValue: 9360,
    status: 'Dispatched & Signed'
  }
];

export const INITIAL_EMPLOYEES: HREmployee[] = [
  {
    id: 'emp-1',
    tenantId: 'tenant-riara',
    employeeNumber: 'EMP-RS-001',
    name: 'Mr. Patrick Kamau',
    nationalId: '12445892',
    tscNumber: 'TSC/489201/ED',
    kraPin: 'A004829103K',
    nssfNumber: '1092837492',
    nhifShifNumber: '9201928301',
    department: 'Executive Administration',
    designation: 'School Principal & Campus Lead',
    employmentType: 'Permanent & Pensionable',
    dateOfJoining: '2015-01-05',
    email: 'admin@riaraschools.ac.ke',
    phone: '+254 703 038 100',
    bankName: 'KCB Bank Kenya',
    bankAccount: '1102938472',
    bankBranch: 'Kilimani Branch',
    basicSalary: 145000,
    houseAllowance: 35000,
    commuterAllowance: 12000,
    hardshipAllowance: 0,
    responsibilityAllowance: 25000,
    grossPay: 217000,
    status: 'Active'
  },
  {
    id: 'emp-2',
    tenantId: 'tenant-riara',
    employeeNumber: 'EMP-RS-002',
    name: 'Mrs. Lydia Muthoni',
    nationalId: '18920394',
    tscNumber: 'TSC/552309/ED',
    kraPin: 'A005910293L',
    nssfNumber: '1102938491',
    nhifShifNumber: '9301928340',
    department: 'Science & Mathematics Faculty',
    designation: 'Senior Science Teacher & Head of STEM',
    employmentType: 'Permanent & Pensionable',
    dateOfJoining: '2018-05-12',
    email: 'l.muthoni@edusmart.ac.ke',
    phone: '+254 722 441 552',
    bankName: 'Equity Bank Kenya',
    bankAccount: '0810294829104',
    bankBranch: 'Community Upper Hill Branch',
    basicSalary: 88000,
    houseAllowance: 22000,
    commuterAllowance: 8000,
    hardshipAllowance: 0,
    responsibilityAllowance: 10000,
    grossPay: 128000,
    status: 'Active'
  },
  {
    id: 'emp-3',
    tenantId: 'tenant-riara',
    employeeNumber: 'EMP-RS-003',
    name: 'Madame Alice Mutiso',
    nationalId: '22839401',
    tscNumber: 'TSC/892019/ED',
    kraPin: 'A006829104M',
    nssfNumber: '1129384910',
    nhifShifNumber: '9401928391',
    department: 'Languages & Humanities',
    designation: 'Grade 7 Mara Class Teacher & English Faculty',
    employmentType: 'Permanent & Pensionable',
    dateOfJoining: '2020-01-08',
    email: 'a.mutiso@edusmart.ac.ke',
    phone: '+254 722 334 455',
    bankName: 'Cooperative Bank of Kenya',
    bankAccount: '01129384910200',
    bankBranch: 'Yaya Centre Branch',
    basicSalary: 74000,
    houseAllowance: 18000,
    commuterAllowance: 6000,
    hardshipAllowance: 0,
    responsibilityAllowance: 5000,
    grossPay: 103000,
    status: 'Active'
  },
  {
    id: 'emp-4',
    tenantId: 'tenant-riara',
    employeeNumber: 'EMP-RS-004',
    name: 'Mr. David Mwangi',
    nationalId: '15920384',
    kraPin: 'A003910294N',
    nssfNumber: '1094839201',
    nhifShifNumber: '9102938492',
    department: 'Finance & Accounts',
    designation: 'School Bursar & Finance Director',
    employmentType: 'Permanent & Pensionable',
    dateOfJoining: '2016-09-01',
    email: 'finance@edusmart.ac.ke',
    phone: '+254 721 889 900',
    bankName: 'Standard Chartered Bank',
    bankAccount: '010209482910',
    bankBranch: 'Harambee Avenue Branch',
    basicSalary: 95000,
    houseAllowance: 25000,
    commuterAllowance: 10000,
    hardshipAllowance: 0,
    responsibilityAllowance: 12000,
    grossPay: 142000,
    status: 'Active'
  },
  {
    id: 'emp-5',
    tenantId: 'tenant-riara',
    employeeNumber: 'EMP-RS-005',
    name: 'Mr. Joseph Otieno',
    nationalId: '24910293',
    kraPin: 'A007910294O',
    nssfNumber: '1139482019',
    nhifShifNumber: '9502938491',
    department: 'Stores & Facilities Logistics',
    designation: 'Chief Storekeeper & Inventory Custodian',
    employmentType: 'Permanent & Pensionable',
    dateOfJoining: '2019-03-15',
    email: 'stores@edusmart.ac.ke',
    phone: '+254 724 667 788',
    bankName: 'NCBA Bank Kenya',
    bankAccount: '10029384910',
    bankBranch: 'Upper Hill Branch',
    basicSalary: 52000,
    houseAllowance: 12000,
    commuterAllowance: 5000,
    hardshipAllowance: 0,
    responsibilityAllowance: 0,
    grossPay: 69000,
    status: 'Active'
  }
];

// Helper to compute Kenyan Statutory Deductions accurately
export function calculateKenyanPayrollDeductions(grossPay: number) {
  // 1. NSSF: Tier I (capped at KES 7,000 * 6% = 420) + Tier II (capped at 36,000 * 6% = 1,740)
  const nssf = 2160;

  // 2. Affordable Housing Levy: 1.5% of Gross Pay
  const housingLevy = Math.round(grossPay * 0.015);

  // 3. NHIF / SHIF: 2.75% of Gross
  const nhifShif = Math.round(grossPay * 0.0275);

  // 4. PAYE (Graduated Tax with KES 2,400 monthly personal relief)
  let taxablePay = grossPay - nssf;
  let tax = 0;
  if (taxablePay <= 24000) {
    tax = taxablePay * 0.10;
  } else if (taxablePay <= 32333) {
    tax = (24000 * 0.10) + ((taxablePay - 24000) * 0.25);
  } else if (taxablePay <= 500000) {
    tax = (24000 * 0.10) + (8333 * 0.25) + ((taxablePay - 32333) * 0.30);
  } else {
    tax = (24000 * 0.10) + (8333 * 0.25) + (467667 * 0.30) + ((taxablePay - 500000) * 0.325);
  }
  const personalRelief = 2400;
  const paye = Math.max(0, Math.round(tax - personalRelief));

  const totalDeductions = paye + nssf + nhifShif + housingLevy;
  const netPay = grossPay - totalDeductions;

  return {
    paye,
    nssf,
    nhifShif,
    housingLevy,
    totalDeductions,
    netPay
  };
}

export const INITIAL_PAYROLL_RUNS: MonthlyPayrollRun[] = [
  {
    id: 'pay-2026-02',
    runNumber: 'PAY-2026-002',
    tenantId: 'tenant-riara',
    payrollMonth: 'February 2026',
    academicYear: '2026',
    term: 'Term 1, 2026',
    totalEmployees: 5,
    totalGrossPay: 659000,
    totalPayeTax: 128450,
    totalNssf: 10800,
    totalNhifShif: 18122,
    totalHousingLevy: 9885,
    totalNetPay: 491743,
    status: 'Disbursed',
    preparedBy: 'Mr. David Mwangi (Bursar)',
    approvedBy: 'Mr. Patrick Kamau (Head Teacher)',
    approvalDate: '2026-02-27 15:30',
    generalLedgerJournalId: 'GL-PAY-2026-02'
  }
];

export const INITIAL_AUDIT_LOGS: OperationsAuditLog[] = [
  {
    id: 'log-1',
    tenantId: 'tenant-riara',
    timestamp: '2026-03-08 14:02:10',
    userEmail: 'admin@riaraschools.ac.ke',
    userName: 'Mr. Patrick Kamau',
    userRole: 'head_teacher',
    module: 'Procurement',
    actionType: 'REQUISITION_APPROVED',
    description: 'Final executive approval granted for Science Laboratory Requisition REQ-2026-0042.',
    referenceId: 'REQ-2026-0042',
    amountImpacted: 113300
  },
  {
    id: 'log-2',
    tenantId: 'tenant-riara',
    timestamp: '2026-03-09 10:15:30',
    userEmail: 'finance@edusmart.ac.ke',
    userName: 'Mr. David Mwangi',
    userRole: 'finance_officer',
    module: 'Procurement',
    actionType: 'LPO_ISSUED',
    description: 'Issued LPO-2026-0088 to Chemlab Kenya East Africa Ltd.',
    referenceId: 'LPO-2026-0088',
    amountImpacted: 131428
  },
  {
    id: 'log-3',
    tenantId: 'tenant-riara',
    timestamp: '2026-03-12 11:45:00',
    userEmail: 'stores@edusmart.ac.ke',
    userName: 'Mr. Joseph Otieno',
    userRole: 'storekeeper',
    module: 'Stores',
    actionType: 'GRN_ACCEPTED',
    description: 'Received Goods Received Note GRN-2026-0104. Added 4 microscopes & 6 acid bottles to stock.',
    referenceId: 'GRN-2026-0104',
    amountImpacted: 90800
  },
  {
    id: 'log-4',
    tenantId: 'tenant-riara',
    timestamp: '2026-03-13 09:30:15',
    userEmail: 'stores@edusmart.ac.ke',
    userName: 'Mr. Joseph Otieno',
    userRole: 'storekeeper',
    module: 'Stores',
    actionType: 'STORE_ISSUED',
    description: 'Dispatched SIV-2026-0210: 36 CBC portfolios to Grade 7 Mara Class Teacher.',
    referenceId: 'SIV-2026-0210',
    amountImpacted: 9360
  }
];
