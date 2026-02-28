import { jsPDF } from 'jspdf';
import { LOGO_URL } from '../lib/branding';

const statusLabels = { in_stock: 'In Stock', out: 'Out', reserved: 'Reserved' };

function loadLogoImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function exportInventoryPDF(items, categoryFilter = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 10;

  // Company logo - top of PDF (uses image URL directly)
  const logoW = 45;
  const logoH = 16;
  const logoX = (pageWidth - logoW) / 2;
  const logoImg = await loadLogoImage(LOGO_URL);
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', logoX, y, logoW, logoH);
    } catch {
      // Fallback: try fetch + base64 if Image fails
      try {
        const res = await fetch(LOGO_URL, { mode: 'cors' });
        const blob = await res.blob();
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        doc.addImage(dataUrl, 'PNG', logoX, y, logoW, logoH);
      } catch {
        doc.setFontSize(18);
        doc.setTextColor(193, 58, 42);
        doc.text('AsahiGroup', pageWidth / 2, y + logoH / 2 + 2, { align: 'center' });
      }
    }
  } else {
    doc.setFontSize(18);
    doc.setTextColor(193, 58, 42);
    doc.text('AsahiGroup', pageWidth / 2, y + logoH / 2 + 2, { align: 'center' });
  }
  y += logoH + 6;

  // Report title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Spare Parts Inventory Report', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Asahi Motors Spare Parts Inventory System', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Total items: ${items.length}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  if (categoryFilter) {
    doc.setFont(undefined, 'italic');
    doc.text(`Filtered by category: ${categoryFilter}`, pageWidth / 2, y, { align: 'center' });
    doc.setFont(undefined, 'normal');
    y += 4;
  }
  y += 6;

  doc.setFontSize(9);
  const headers = ['Name', 'QR ID', 'Category', 'Location', 'Qty', 'Status', 'Vehicle'];
  const colWidths = [38, 32, 28, 28, 12, 22, 25];
  let x = 14;

  headers.forEach((h, i) => {
    doc.setFont(undefined, 'bold');
    doc.text(h, x, y);
    x += colWidths[i];
  });
  y += 7;
  doc.setFont(undefined, 'normal');

  items.forEach((item) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Asahi Motors Spare Parts Inventory System', pageWidth / 2, 12, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y = 25;
    }
    x = 14;
    const row = [
      (item.name || '').slice(0, 18),
      (item.qr_id || '').slice(0, 10),
      (item.category || '-').slice(0, 10),
      (item.store_location || '-').slice(0, 10),
      String(item.quantity || 0),
      statusLabels[item.status] || item.status,
      (item.vehicle_model || '-').slice(0, 10),
    ];
    row.forEach((val, i) => {
      doc.text(val, x, y);
      x += colWidths[i];
    });
    y += 6;
  });

  const filename = categoryFilter
    ? `spare-parts-${categoryFilter.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
    : `spare-parts-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export async function exportInventoryExcel(items) {
  const XLSX = await import('xlsx');
  const rows = items.map((item) => ({
    Name: item.name || '',
    'QR ID': item.qr_id || '',
    'Model Name': item.model_name || '',
    'SKU Code': item.sku_code || '',
    Description: item.description || '',
    Category: item.category || '',
    'Store Location': item.store_location || '',
    'Vehicle Model': item.vehicle_model || '',
    Quantity: item.quantity ?? '',
    Status: statusLabels[item.status] || item.status,
    'Added Date': item.added_date ? new Date(item.added_date).toLocaleString() : '',
    'Last Used': item.last_used_date ? new Date(item.last_used_date).toLocaleString() : '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Spare Parts');
  XLSX.writeFile(wb, `spare-parts-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportInventoryCSV(items, categoryFilter = null) {
  const headers = ['Name', 'QR ID', 'Model Name', 'SKU Code', 'Description', 'Category', 'Store Location', 'Vehicle Model', 'Quantity', 'Status', 'Added By', 'Added Date', 'Last Used By', 'Last Used'];
  const rows = items.map((item) => [
    `"${(item.name || '').replace(/"/g, '""')}"`,
    item.qr_id || '',
    item.model_name || '',
    item.sku_code || '',
    `"${(item.description || '').replace(/"/g, '""')}"`,
    item.category || '',
    item.store_location || '',
    item.vehicle_model || '',
    item.quantity ?? '',
    statusLabels[item.status] || item.status,
    item.added_by || '',
    item.added_date ? new Date(item.added_date).toLocaleString() : '',
    item.last_used_by || '',
    item.last_used_date ? new Date(item.last_used_date).toLocaleString() : '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const filename = categoryFilter
    ? `spare-parts-${categoryFilter.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    : `spare-parts-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
