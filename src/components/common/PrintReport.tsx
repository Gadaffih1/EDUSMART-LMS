import React, { useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  Calendar, 
  User as UserIcon, 
  GraduationCap, 
  ShieldCheck, 
  Award,
  BookOpen,
  QrCode,
  FileText
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { TenantPrintHeader, TenantPrintFooter } from './TenantPrintHeader';

export interface PrintReportMetadata {
  studentName?: string;
  admissionNumber?: string;
  grade?: number | string;
  stream?: string;
  academicYear?: string | number;
  term?: string;
  reportDate?: string;
  classTeacher?: string;
  principalName?: string;
  documentRef?: string;
  reportTitle?: string;
  reportSubtitle?: string;
}

export interface PrintReportTableColumn {
  header: string;
  accessor: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface PrintReportProps {
  title?: string;
  subtitle?: string;
  documentRef?: string;
  metadata?: PrintReportMetadata;
  columns?: PrintReportTableColumn[];
  data?: Array<Record<string, any>>;
  children?: React.ReactNode;
  summaryHighlights?: Array<{ label: string; value: string | number; badge?: string }>;
  teacherRemarks?: string;
  principalRemarks?: string;
  onClose?: () => void;
  showSignatures?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export const PrintReport: React.FC<PrintReportProps> = ({
  title = 'Official Student Academic Performance Report',
  subtitle,
  documentRef,
  metadata,
  columns,
  data,
  children,
  summaryHighlights,
  teacherRemarks,
  principalRemarks,
  onClose,
  showSignatures = true,
  orientation = 'portrait'
}) => {
  const { currentTenant } = useTenant();
  const printContainerRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const finalRef = documentRef || metadata?.documentRef || `EDUSMART/RPT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
  const finalDate = metadata?.reportDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-slate-100 p-2 sm:p-6 min-h-screen text-slate-900 font-sans">
      
      {/* SCREEN-ONLY TOOLBAR CONTROLS (HIDDEN DURING PRINT) */}
      <div className="no-print max-w-5xl mx-auto mb-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Printer className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Printable Report Generator
            </h2>
            <p className="text-[11px] text-slate-500">
              Clean, printer-friendly document styled with existing @media print CSS utilities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close Print Preview"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div 
        ref={printContainerRef}
        className={`printable-report bg-white mx-auto shadow-md border border-slate-300 p-6 sm:p-10 ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* OFFICIAL INSTITUTIONAL LETTERHEAD WITH TENANT CUSTOMIZED LOGO, THEME & TAGLINE */}
        <TenantPrintHeader
          title={title}
          subtitle={subtitle}
          documentRef={finalRef}
          documentDate={finalDate}
          term={metadata?.term}
          academicYear={metadata?.academicYear?.toString()}
          showWatermark={true}
          className="mb-6"
        />

        {/* METADATA SUMMARY GRID */}
        {metadata && (
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-6 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metadata.studentName && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Learner Name</span>
                <span className="font-bold text-slate-950">{metadata.studentName}</span>
              </div>
            )}
            {metadata.admissionNumber && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Admission No</span>
                <span className="font-bold font-mono text-slate-950">{metadata.admissionNumber}</span>
              </div>
            )}
            {metadata.grade && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Grade & Stream</span>
                <span className="font-bold text-slate-950">Grade {metadata.grade} {metadata.stream ? `(${metadata.stream})` : ''}</span>
              </div>
            )}
            {metadata.term && (
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Academic Session</span>
                <span className="font-bold text-slate-950">{metadata.term} · {metadata.academicYear || currentTenant.academicYear}</span>
              </div>
            )}
          </div>
        )}

        {/* SUMMARY HIGHLIGHTS (IF PROVIDED) */}
        {summaryHighlights && summaryHighlights.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {summaryHighlights.map((item, idx) => (
              <div key={idx} className="border border-slate-300 p-2.5 rounded-lg text-center bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{item.label}</span>
                <span className="text-base font-black text-slate-950 font-mono mt-0.5 block">{item.value}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-1 inline-block">
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STRUCTURED DATA TABLE (IF COLUMNS AND DATA PROVIDED) */}
        {columns && data && data.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold uppercase text-[10px]">
                  {columns.map((col, idx) => (
                    <th 
                      key={idx} 
                      className={`border border-slate-300 px-3 py-2 text-${col.align || 'left'}`}
                      style={{ width: col.width }}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    {columns.map((col, colIdx) => (
                      <td 
                        key={colIdx} 
                        className={`border border-slate-300 px-3 py-2 text-${col.align || 'left'} ${colIdx === 0 ? 'font-medium' : ''}`}
                      >
                        {row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CUSTOM CHILDREN BODY CONTENT */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        {/* TEACHER & PRINCIPAL OFFICIAL COMMENTS */}
        {(teacherRemarks || principalRemarks) && (
          <div className="border border-slate-300 rounded-lg p-3.5 mb-6 text-xs space-y-3 bg-slate-50">
            {teacherRemarks && (
              <div>
                <span className="font-bold text-slate-800 uppercase text-[10px] block">Class Teacher Remarks:</span>
                <p className="text-slate-700 italic mt-0.5">"{teacherRemarks}"</p>
              </div>
            )}
            {principalRemarks && (
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 uppercase text-[10px] block">Head of School Remarks:</span>
                <p className="text-slate-700 italic mt-0.5">"{principalRemarks}"</p>
              </div>
            )}
          </div>
        )}

        {/* OFFICIAL INSTITUTIONAL ENDORSEMENTS & CERTIFIED FOOTER WITH TENANT TAGLINE */}
        <TenantPrintFooter
          showSignature={showSignatures}
          principalTitleOverride={currentTenant.principalTitle}
          signatureNameOverride={metadata?.principalName || currentTenant.principalName}
          customNote={currentTenant.printFooterNotes}
        />

      </div>
    </div>
  );
};
