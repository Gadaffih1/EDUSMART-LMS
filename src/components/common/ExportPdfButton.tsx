import React from 'react';
import { Printer, Download } from 'lucide-react';
import { exportToPdf, PdfExportOptions } from '../../utils/pdfExport';

interface ExportPdfButtonProps {
  title?: string;
  elementId?: string;
  orientation?: 'portrait' | 'landscape';
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
}

export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  title = 'EduSmart_Institutional_Report',
  elementId,
  orientation = 'portrait',
  label = 'Print / Save PDF',
  variant = 'primary',
  size = 'md',
  className = '',
  iconOnly = false
}) => {
  const handleClick = () => {
    exportToPdf({
      title,
      elementId,
      orientation
    });
  };

  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all rounded-xl cursor-pointer shadow-2xs gap-1.5';
  
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-xs px-3.5 py-2',
    lg: 'text-sm px-4 py-2.5'
  }[size];

  const variantStyles = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10',
    secondary: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/10',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400',
    minimal: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-none'
  }[variant];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      title={`Print or Save "${title}" as PDF`}
    >
      <Printer className={size === 'sm' ? 'w-3.5 h-3.5 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
};
