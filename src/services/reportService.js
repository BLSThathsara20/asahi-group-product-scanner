import { jsPDF } from 'jspdf';
import { LOGO_URL } from '../lib/branding';

const statusLabels = { in_stock: 'In Stock', out: 'Out', reserved: 'Reserved' };

async function loadLogoBase64() {
  try {
    const res = await fetch(LOGO_URL, {
      mode: 'cors',
      referrerPolicy: 'no-referrer',
    });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportInventoryPDF(items) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 10;

  // Company logo - centered at top
  const logoData = await loadLogoBase64();
  const logoW = 45;
  const logoH = 16;
  const logoX = (pageWidth - logoW) / 2;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', logoX, y, logoW, logoH);
    } catch {
      doc.setFontSize(18);
      doc.setTextColor(193, 58, 42);
      doc.text('AsahiGroup', pageWidth / 2, y + logoH / 2 + 2, { align: 'center' });
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
  y += 10;

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

  doc.save(`spare-parts-report-${new Date().toISOString().slice(0, 10)}.pdf`);
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

export function exportInventoryCSV(items) {
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
  link.download = `spare-parts-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
