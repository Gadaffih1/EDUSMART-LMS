import React from 'react';
import { PrintReport, PrintReportProps } from './PrintReport';

interface PrintReportModalProps extends PrintReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  ...props
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-h-[96vh] overflow-y-auto">
        <PrintReport {...props} onClose={onClose} />
      </div>
    </div>
  );
};
