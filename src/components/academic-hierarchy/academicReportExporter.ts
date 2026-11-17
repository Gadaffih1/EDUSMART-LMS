import * as XLSX from 'xlsx';
import type { Tenant } from '../../types/tenant';

export interface AcademicExportSection {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export function exportAcademicReportToExcel(
  reportTitle: string,
  tenantName: string,
  summaryPairs: Array<[string, string]>,
  sections: AcademicExportSection[]
): void {
  const wb = XLSX.utils.book_new();

  const overviewRows: Array<Array<string | number>> = [
    [tenantName],
    [reportTitle],
    [`Generated: ${new Date().toLocaleString('en-GB')}`],
    [],
    ['Metric', 'Value'],
    ...summaryPairs,
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

  sections.forEach((section, idx) => {
    const aoa: Array<Array<string | number>> = [
      [section.title],
      section.columns,
      ...(section.rows.length > 0 ? section.rows : [['No records available']]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const safeName =
      section.title
        .replace(/[:\\/?*[\]]/g, '')
        .slice(0, 28)
        .trim() || `Sheet ${idx + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  });

  const slug = reportTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
  XLSX.writeFile(wb, `${slug || 'grade_report'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function escapeHtml(raw: string | number): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Prints an institutional PDF dossier strictly branded with the active tenant school's
 * logo, motto, contact metadata, and signatory block using an isolated print iframe
 * (never opens popups or uses EduSmart platform branding).
 */
export function printAcademicReportPdf(
  tenant: Tenant,
  title: string,
  subtitle: string,
  summaryPairs: Array<[string, string]>,
  sections: AcademicExportSection[]
): void {
  if (typeof document === 'undefined') return;

  const logoSrc = tenant.customLogoBase64 || tenant.logoUrl || '';
  const primaryHex = tenant.primaryColorHex || '#0f172a';
  const schoolInitials = (tenant.shortName || tenant.name || 'SC')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const logoMarkup = logoSrc
    ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(tenant.name)}" style="width:68px;height:68px;object-fit:contain;border-radius:10px;border:1px solid #cbd5e1;padding:4px;background:#fff;" />`
    : `<div style="width:68px;height:68px;border-radius:10px;background:${escapeHtml(primaryHex)};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;">${escapeHtml(schoolInitials)}</div>`;

  const kpiHtml = summaryPairs
    .map(
      ([label, val]) => `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#f8fafc;">
        <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:0.04em;">${escapeHtml(label)}</div>
        <div style="font-size:14px;font-weight:800;color:#0f172a;margin-top:2px;font-variant-numeric:tabular-nums;">${escapeHtml(val)}</div>
      </div>`
    )
    .join('');

  const sectionsHtml = sections
    .map((sec) => {
      const ths = sec.columns
        .map(
          (col) =>
            `<th style="text-align:left;padding:7px 8px;border-bottom:2px solid #cbd5e1;font-size:11px;color:#334155;background:#f1f5f9;">${escapeHtml(col)}</th>`
        )
        .join('');
      const trs =
        sec.rows.length > 0
          ? sec.rows
              .map(
                (r) =>
                  `<tr>${r
                    .map(
                      (cell) =>
                        `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${escapeHtml(cell)}</td>`
                    )
                    .join('')}</tr>`
              )
              .join('')
          : `<tr><td colspan="${sec.columns.length}" style="padding:10px;font-size:11px;color:#64748b;">No entries recorded for this period.</td></tr>`;

      return `
        <div style="margin-top:18px;page-break-inside:avoid;">
          <h3 style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(sec.title)}</h3>
          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;">
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
          </table>
        </div>`;
    })
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div style="border-bottom:2px solid ${escapeHtml(primaryHex)};padding-bottom:12px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
    <div style="display:flex;align-items:center;gap:14px;">
      ${logoMarkup}
      <div>
        <div style="font-size:18px;font-weight:800;color:#0f172a;text-transform:uppercase;">${escapeHtml(tenant.name)}</div>
        <div style="font-size:11px;color:#475569;margin-top:2px;">${escapeHtml(tenant.motto || 'Excellence & Integrity')}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">${escapeHtml([tenant.address, tenant.city, tenant.phone, tenant.email].filter(Boolean).join(' · '))}</div>
      </div>
    </div>
    <div style="text-align:right;font-size:10px;color:#475569;">
      <div style="font-weight:700;color:#0f172a;">CODE: ${escapeHtml(tenant.code)}</div>
      <div>${escapeHtml(tenant.registrationNumber || '')}</div>
      <div>Printed: ${escapeHtml(new Date().toLocaleDateString('en-GB'))}</div>
    </div>
  </div>

  <div style="margin-top:14px;">
    <h1 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">${escapeHtml(title)}</h1>
    <p style="margin:3px 0 0 0;font-size:11px;color:#475569;">${escapeHtml(subtitle)}</p>
  </div>

  <div style="margin-top:14px;display:grid;grid-template-columns:repeat(4, minmax(0, 1fr));gap:8px;">
    ${kpiHtml}
  </div>

  ${sectionsHtml}

  <div style="margin-top:28px;padding-top:12px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;font-size:11px;color:#334155;">
    <div>
      <div style="border-bottom:1px solid #64748b;width:190px;height:26px;"></div>
      <div style="margin-top:4px;font-weight:700;">Senior Teacher / Coordinator</div>
    </div>
    <div>
      <div style="border-bottom:1px solid #64748b;width:190px;height:26px;"></div>
      <div style="margin-top:4px;font-weight:700;">${escapeHtml(tenant.principalTitle || 'Principal / Head of School')}</div>
    </div>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1500);
    }
  }, 250);
}
