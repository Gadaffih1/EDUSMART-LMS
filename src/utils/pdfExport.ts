/**
 * EduSmart General-Purpose PDF & Print Export Utility
 * 
 * Works seamlessly with browser native PDF printing and respects the 
 * print media styles defined in src/index.css (@media print).
 */

export interface PdfExportOptions {
  /**
   * Title used for document title (which becomes default saved PDF file name)
   */
  title?: string;
  /**
   * Element ID to isolate for printing. If omitted, prints current printable page.
   */
  elementId?: string;
  /**
   * Page orientation hint: 'portrait' | 'landscape'
   */
  orientation?: 'portrait' | 'landscape';
  /**
   * Callback fired before print dialog launches
   */
  onBeforePrint?: () => void;
  /**
   * Callback fired after print dialog closes
   */
  onAfterPrint?: () => void;
}

/**
 * Triggers clean PDF generation using browser print capabilities,
 * respecting @media print styles, exact colors, and table formatting.
 */
export function exportToPdf(options: PdfExportOptions = {}): void {
  const {
    title = 'EduSmart_Institutional_Report',
    orientation = 'portrait',
    elementId,
    onBeforePrint,
    onAfterPrint
  } = options;

  if (onBeforePrint) {
    onBeforePrint();
  }

  // Backup original document title
  const originalTitle = document.title;
  const sanitizedTitle = `${title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim()}_${new Date().toISOString().split('T')[0]}`;
  document.title = sanitizedTitle;

  // If specific element is targeted, ensure it has .printable-report styling class
  let targetElement: HTMLElement | null = null;
  if (elementId) {
    targetElement = document.getElementById(elementId);
    if (targetElement && !targetElement.classList.contains('printable-report')) {
      targetElement.classList.add('printable-report');
    }
  }

  // Inject temporary page orientation rule if landscape requested
  let styleSheet: HTMLStyleElement | null = null;
  if (orientation === 'landscape') {
    styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = '@media print { @page { size: landscape; margin: 12mm; } }';
    document.head.appendChild(styleSheet);
  }

  // Launch print dialog
  try {
    window.print();
  } finally {
    // Restore document title and cleanup style
    setTimeout(() => {
      document.title = originalTitle;
      if (styleSheet && document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
      if (onAfterPrint) {
        onAfterPrint();
      }
    }, 500);
  }
}

/**
 * Quick helper to print an analytics or data table
 */
export function printReportTable(tableContainerId: string, reportTitle: string): void {
  exportToPdf({
    elementId: tableContainerId,
    title: reportTitle,
    orientation: 'landscape'
  });
}
