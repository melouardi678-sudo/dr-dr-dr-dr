import { DentalConsultationDetails, DentalToothStatus } from '../types';

export function printMedicalReport(title: string, sections: Array<{ label: string; value: string }>): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Autorisez les fenêtres contextuelles pour imprimer ce rapport.');
    return;
  }

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] || character);

  const rows = sections
    .map(({ label, value }) => `<section><h2>${escapeHtml(label)}</h2><p>${escapeHtml(value || '—').replace(/\n/g, '<br>')}</p></section>`)
    .join('');

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    body{font:14px Arial,sans-serif;color:#172033;max-width:800px;margin:40px auto;padding:0 24px}
    h1{color:#047857;border-bottom:2px solid #10b981;padding-bottom:12px}
    section{margin:18px 0;break-inside:avoid}h2{font-size:14px;margin:0 0 6px}
    p{margin:0;white-space:normal;line-height:1.55;border:1px solid #dbe3eb;border-radius:6px;padding:10px}
    .date{color:#64748b;font-size:12px}
    @media print{body{margin:15mm auto;padding:0}}
  </style></head><body><h1>${escapeHtml(title)}</h1><p class="date">Émis le ${escapeHtml(new Date().toLocaleDateString('fr-FR'))}</p>${rows}<script>window.onload=()=>window.print()</script></body></html>`);
  printWindow.document.close();
}

export function printDentalOdontogram(patientName: string, details: DentalConsultationDetails): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Autorisez les fenêtres contextuelles pour imprimer ou exporter le PDF.');
    return;
  }

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] || character);

  const colors: Record<DentalToothStatus, string> = {
    'Dent Saine': '#f8fafc',
    'Carie': '#dc2626',
    'Carie Profonde': '#991b1b',
    'Dent Absente': '#64748b',
    'Dent Extraite': '#64748b',
    'Dent Cassée': '#ea580c',
    'Obturation': '#0284c7',
    'Dévitalisée': '#7c3aed',
    'Traitement Endodontique': '#7c3aed',
    'Couronne': '#9333ea',
    'Bridge': '#9333ea',
    'Implant': '#059669',
    'Dent Mobile': '#ca8a04',
    'Infection': '#dc2626',
    'Abcès': '#b91c1c',
    'Fracture': '#ea580c',
    'Dent Incluse': '#475569',
    'Prothèse': '#9333ea',
    'À Traiter': '#f97316',
    'Dent à Traiter': '#f97316',
  };
  const arches = [
    { label: 'Maxillaire permanent', rows: [[['18', '17', '16', '15', '14', '13', '12', '11'], ['21', '22', '23', '24', '25', '26', '27', '28']]] },
    { label: 'Mandibule permanente', rows: [[['48', '47', '46', '45', '44', '43', '42', '41'], ['31', '32', '33', '34', '35', '36', '37', '38']]] },
    { label: 'Maxillaire temporaire', rows: [[['55', '54', '53', '52', '51'], ['61', '62', '63', '64', '65']]] },
    { label: 'Mandibule temporaire', rows: [[['85', '84', '83', '82', '81'], ['71', '72', '73', '74', '75']]] },
  ];

  const toothHtml = (tooth: string) => {
    const record = details.toothDetails?.[tooth];
    const status = record?.status || details.toothStatuses[tooth] || 'Dent Saine';
    const fill = colors[status] || colors['Dent Saine'];
    const surfaces = [
      ['7,6 21,6 21,22 4,22', 'M'],
      ['21,6 35,6 38,22 21,22', 'D'],
      ['4,22 38,22 35,36 7,36', 'O'],
      ['7,36 21,36 21,48 12,45', 'V'],
      ['21,36 35,36 30,45 21,48', 'LP'],
    ] as const;
    const image = `<svg viewBox="0 0 42 54" aria-label="Dent ${tooth} ${escapeHtml(status)}"><path d="M7 7 Q7 2 14 3 L28 3 Q36 3 36 9 L38 22 Q38 29 34 36 L30 47 Q27 53 23 48 L21 43 L18 49 Q14 53 11 46 L7 35 Q3 27 4 21 Z" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>${surfaces.map(([points, surface]) => `<polygon points="${points}" fill="${colors[record?.surfaces[surface] || status] || fill}" stroke="#334155" stroke-width=".8"/>`).join('')}<path d="M7 7 Q7 2 14 3 L28 3 Q36 3 36 9 L38 22 Q38 29 34 36 L30 47 Q27 53 23 48 L21 43 L18 49 Q14 53 11 46 L7 35 Q3 27 4 21 Z" fill="none" stroke="#0f172a" stroke-width="1.5"/></svg>`;
    return `<div class="tooth">${image}<b>${tooth}</b><small>${escapeHtml(status)}</small></div>`;
  };
  const archHtml = arches.map((arch) => `
    <section class="arch">
      <h2>${arch.label}</h2>
      ${arch.rows.map((row) => `<div class="row"><div class="quadrant">${row[0].map(toothHtml).join('')}</div><span class="midline"></span><div class="quadrant">${row[1].map(toothHtml).join('')}</div></div>`).join('')}
    </section>`).join('');
  const legend = [
    ['Saine', '#f8fafc'], ['Carie / infection', '#dc2626'], ['Obturation', '#0284c7'],
    ['Absente / extraite', '#64748b'], ['Couronne / prothèse', '#9333ea'],
    ['Implant', '#059669'], ['À traiter', '#f97316'],
  ].map(([label, color]) => `<span><i style="background:${color}"></i>${label}</span>`).join('');

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Odontogramme FDI</title><style>
    *{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#172033;max-width:1100px;margin:24px auto;padding:0 20px}
    h1{color:#047857;margin-bottom:4px}.meta{color:#64748b;margin:0 0 18px}
    .arch{margin:18px 0;padding:12px;border:1px solid #cbd5e1;border-radius:8px;break-inside:avoid}
    .arch h2{font-size:13px;margin:0 0 8px;text-align:center}.row{display:flex;justify-content:center;align-items:flex-end;gap:8px;margin:5px 0}
    .quadrant{display:flex;gap:4px}.midline{height:42px;border-left:1px dashed #94a3b8}
    .tooth{width:64px;text-align:center;font-size:9px}.tooth svg{display:block;width:32px;height:40px;margin:auto}.tooth b{display:block;font-size:10px}
    .tooth small{display:block;min-height:20px;color:#475569;font-size:8px}
    .legend{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0}.legend span{display:inline-flex;align-items:center;gap:4px}.legend i{width:12px;height:12px;border:1px solid #64748b;display:inline-block}
    @media print{body{margin:10mm auto;padding:0}.arch{break-inside:avoid}}
  </style></head><body><h1>Odontogramme dentaire — Système FDI</h1><p class="meta">Patient : ${escapeHtml(patientName)} · Émis le ${escapeHtml(new Date().toLocaleDateString('fr-FR'))}</p>${archHtml}<div class="legend">${legend}</div><script>window.onload=()=>window.print()</script></body></html>`);
  printWindow.document.close();
}
