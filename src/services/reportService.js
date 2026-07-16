import { jsPDF } from 'jspdf';
import { LOGO_URL } from '../lib/branding';
import { getItemPageUrl } from '../lib/utils';
import { formatVehicleFitments } from '../lib/vehicleFitments';
import { getTodayStockMovements } from './analyticsService';
import { buildStockTree, flattenModelOrderAlertRows, flattenStockTreeRows, getOrderAlertDetails } from '../lib/stockTree';
import { LOW_STOCK_THRESHOLD } from '../lib/stockAlerts';

const statusLabels = { in_stock: 'In Stock', out: 'Out', reserved: 'Reserved' };

const PDF_THEME = {
  margin: 12,
  brand: [193, 58, 42],
  brandLight: [253, 242, 240],
  brandDark: [153, 45, 32],
  slate50: [248, 250, 252],
  slate100: [241, 245, 249],
  slate200: [226, 232, 240],
  slate500: [100, 116, 139],
  slate600: [71, 85, 105],
  slate800: [30, 41, 59],
  white: [255, 255, 255],
  red: [220, 38, 38],
  redLight: [254, 242, 242],
  amber: [217, 119, 6],
  amberLight: [255, 251, 235],
  green: [5, 150, 105],
  greenLight: [236, 253, 245],
  link: [37, 99, 235],
};

function loadLogoImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Load logo as data URL — fetch first for reliable PDF embedding. */
async function resolveLogoDataUrl() {
  try {
    const res = await fetch(LOGO_URL, { mode: 'cors' });
    if (!res.ok) throw new Error('Logo fetch failed');
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    const img = await loadLogoImage(LOGO_URL);
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  }
}

function pageWidth(doc) {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc) {
  return doc.internal.pageSize.getHeight();
}

function contentWidth(doc) {
  return pageWidth(doc) - PDF_THEME.margin * 2;
}

function sumMovementQty(list) {
  return (list || []).reduce((sum, tx) => sum + (tx.quantity ?? 1), 0);
}

function formatMovementTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString(undefined, { timeStyle: 'short' });
}

function formatMovementDetail(tx) {
  if (tx.type === 'out') {
    const parts = [];
    if (tx.recipient_name) parts.push(`To: ${tx.recipient_name}`);
    if (tx.purpose) parts.push(tx.purpose);
    if (tx.vehicle_model) parts.push(`Vehicle: ${tx.vehicle_model}`);
    return parts.join(' · ') || 'Checked out';
  }
  return tx.notes || 'Checked in';
}

function truncateForPdf(doc, text, maxWidth) {
  let value = String(text || '');
  while (value.length > 0 && doc.getTextWidth(value) > maxWidth) {
    value = value.slice(0, -1);
  }
  return value.length < String(text || '').length ? `${value}…` : value;
}

function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || '—'), maxWidth);
}

function drawPdfText(doc, text, x, y, { align = 'left', url, color }) {
  if (color) doc.setTextColor(...color);
  const value = String(text || '—');
  if (url && typeof doc.textWithLink === 'function') {
    let linkX = x;
    const textWidth = doc.getTextWidth(value);
    if (align === 'center') linkX = x - textWidth / 2;
    else if (align === 'right') linkX = x - textWidth;
    doc.textWithLink(value, linkX, y, { url });
    return;
  }
  doc.text(value, x, y, { align });
}

function ensurePageSpace(doc, y, needed = 20) {
  if (y <= pageHeight(doc) - needed) return y;
  doc.addPage();
  drawPageChrome(doc);
  return 28;
}

function drawPageChrome(doc) {
  const w = pageWidth(doc);
  doc.setFillColor(...PDF_THEME.brand);
  doc.rect(0, 0, w, 6, 'F');
}

function addPageFooters(doc, exportedBy) {
  if (!exportedBy) return;
  const total = doc.getNumberOfPages();
  doc.setPage(total);
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...PDF_THEME.slate600);
  doc.text(`Exported by: ${exportedBy}`, w / 2, h - 8, { align: 'center' });
}

async function drawDailyReportHeader(doc, { dateLabel, generatedAt }) {
  drawPageChrome(doc);
  const w = pageWidth(doc);
  const m = PDF_THEME.margin;
  let y = 12;

  const logoData = await resolveLogoDataUrl();
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', m, y, 56, 20);
    } catch {
      /* no text fallback — header layout still works */
    }
  }

  const titleX = w - m;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...PDF_THEME.slate800);
  doc.text('Daily Spare Parts Report', titleX, y + 7, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_THEME.slate600);
  doc.text('Asahi Motors UK Group', titleX, y + 13, { align: 'right' });
  doc.text(dateLabel, titleX, y + 18, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...PDF_THEME.slate500);
  doc.text(`Generated ${generatedAt}`, titleX, y + 23, { align: 'right' });

  y += 30;
  doc.setDrawColor(...PDF_THEME.slate200);
  doc.setLineWidth(0.4);
  doc.line(m, y, w - m, y);
  return y + 8;
}

function drawStatCards(doc, y, stats) {
  const m = PDF_THEME.margin;
  const gap = 4;
  const cardW = (contentWidth(doc) - gap * 3) / 4;
  const cardH = 24;

  y = ensurePageSpace(doc, y, cardH + 8);

  stats.forEach((stat, index) => {
    const x = m + index * (cardW + gap);
    doc.setFillColor(...(stat.bg || PDF_THEME.slate50));
    doc.setDrawColor(...PDF_THEME.slate200);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

    doc.setFillColor(...(stat.accent || PDF_THEME.brand));
    doc.roundedRect(x, y, cardW, 3, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...PDF_THEME.slate500);
    doc.text(stat.label.toUpperCase(), x + cardW / 2, y + 9, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(...(stat.color || PDF_THEME.slate800));
    doc.text(String(stat.value), x + cardW / 2, y + 17, { align: 'center' });

    if (stat.sub) {
      doc.setFontSize(6.5);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...PDF_THEME.slate500);
      doc.text(stat.sub, x + cardW / 2, y + 21.5, { align: 'center' });
    }
  });

  doc.setFont(undefined, 'normal');
  return y + cardH + 10;
}

function drawSectionHeader(doc, y, title, badge) {
  const m = PDF_THEME.margin;
  const w = pageWidth(doc);
  y = ensurePageSpace(doc, y, 18);

  doc.setFillColor(...PDF_THEME.brandLight);
  doc.setDrawColor(...PDF_THEME.slate200);
  doc.setLineWidth(0.2);
  doc.roundedRect(m, y, contentWidth(doc), 11, 2, 2, 'FD');
  doc.setFillColor(...PDF_THEME.brand);
  doc.rect(m, y + 1.5, 2.5, 8, 'F');

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...PDF_THEME.slate800);
  doc.text(title, m + 7, y + 7.5);

  if (badge) {
    doc.setFontSize(7.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...PDF_THEME.slate600);
    doc.text(badge, w - m - 4, y + 7.5, { align: 'right' });
  }

  return y + 15;
}

function drawEmptyState(doc, y, message) {
  const m = PDF_THEME.margin;
  y = ensurePageSpace(doc, y, 16);
  doc.setFillColor(...PDF_THEME.slate50);
  doc.setDrawColor(...PDF_THEME.slate200);
  doc.roundedRect(m, y, contentWidth(doc), 12, 2, 2, 'FD');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_THEME.slate500);
  doc.text(message, m + contentWidth(doc) / 2, y + 7.5, { align: 'center' });
  return y + 16;
}

function drawDataTable(doc, y, { columns, rows, emptyMessage, highlightLowStock = false }) {
  const m = PDF_THEME.margin;
  const tableW = contentWidth(doc);
  const headerH = 8;
  const rowPad = 3;
  const fontSize = 7.5;

  if (!rows.length) {
    return drawEmptyState(doc, y, emptyMessage || 'No records');
  }

  y = ensurePageSpace(doc, y, headerH + 10);
  let tableTop = y;

  doc.setFillColor(...PDF_THEME.brandDark);
  doc.roundedRect(m, tableTop, tableW, headerH, 2, 2, 'F');
  doc.setFontSize(fontSize);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...PDF_THEME.white);

  let x = m + 3;
  columns.forEach((col) => {
    const textX = col.align === 'center' ? x + col.width / 2 : col.align === 'right' ? x + col.width - 2 : x + 2;
    doc.text(col.label, textX, tableTop + 5.5, { align: col.align || 'left' });
    x += col.width;
  });

  y = tableTop + headerH;
  doc.setFont(undefined, 'normal');

  rows.forEach((row, rowIndex) => {
    const isLowStock = highlightLowStock && row._lowStock;
    const cellLines = columns.map((col) => {
      const raw = col.render ? col.render(row) : row[col.key];
      return wrapText(doc, raw, col.width - 4);
    });
    const lineCount = Math.max(...cellLines.map((lines) => lines.length), 1);
    const rowH = lineCount * 3.8 + rowPad * 2;

    if (y + rowH > pageHeight(doc) - 16) {
      doc.addPage();
      drawPageChrome(doc);
      y = 28;
      tableTop = y;
      doc.setFillColor(...PDF_THEME.brandDark);
      doc.roundedRect(m, tableTop, tableW, headerH, 2, 2, 'F');
      doc.setFontSize(fontSize);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...PDF_THEME.white);
      x = m + 3;
      columns.forEach((col) => {
        const textX = col.align === 'center' ? x + col.width / 2 : col.align === 'right' ? x + col.width - 2 : x + 2;
        doc.text(col.label, textX, tableTop + 5.5, { align: col.align || 'left' });
        x += col.width;
      });
      y = tableTop + headerH;
      doc.setFont(undefined, 'normal');
    }

    const fill = isLowStock
      ? PDF_THEME.redLight
      : rowIndex % 2 === 0
        ? PDF_THEME.white
        : PDF_THEME.slate50;
    doc.setFillColor(...fill);
    doc.setDrawColor(...PDF_THEME.slate200);
    doc.setLineWidth(0.15);
    doc.rect(m, y, tableW, rowH, 'FD');

    if (isLowStock) {
      doc.setFillColor(...PDF_THEME.red);
      doc.rect(m, y, 1.2, rowH, 'F');
    }

    x = m + 3;
    columns.forEach((col, colIndex) => {
      const lines = cellLines[colIndex];
      const textColor = isLowStock ? PDF_THEME.red : PDF_THEME.slate800;
      doc.setTextColor(...textColor);
      doc.setFontSize(fontSize);
      if (col.bold && !isLowStock) doc.setFont(undefined, 'bold');

      lines.forEach((line, lineIndex) => {
        const lineY = y + rowPad + 3 + lineIndex * 3.8;
        const textX = col.align === 'center' ? x + col.width / 2 : col.align === 'right' ? x + col.width - 2 : x + 2;
        const linkUrl = col.linkKey && lineIndex === 0 ? row[col.linkKey] : null;
        if (col.bold && lineIndex > 0) {
          doc.setFontSize(fontSize - 0.5);
          doc.setTextColor(...(isLowStock ? PDF_THEME.red : PDF_THEME.slate500));
          doc.setFont(undefined, 'normal');
        }
        if (linkUrl) {
          drawPdfText(doc, line, textX, lineY, {
            align: col.align || 'left',
            url: linkUrl,
            color: isLowStock ? PDF_THEME.red : PDF_THEME.link,
          });
        } else {
          doc.text(line, textX, lineY, { align: col.align || 'left' });
        }
        if (col.bold && lineIndex > 0) {
          doc.setFontSize(fontSize);
          doc.setTextColor(...(isLowStock ? PDF_THEME.red : PDF_THEME.slate800));
        }
      });

      if (col.bold && !isLowStock) doc.setFont(undefined, 'normal');
      x += col.width;
    });

    y += rowH;
  });

  doc.setTextColor(...PDF_THEME.slate800);
  return y + 6;
}

function drawStockTreeSection(doc, y, items) {
  const tree = buildStockTree(items);
  const rows = flattenStockTreeRows(tree).map((row) => ({
    part: row.label,
    units: String(row.units),
    fits: row.fits,
    low: row.low,
    _lowStock: row.isLowStock,
  }));

  y = drawSectionHeader(
    doc,
    y,
    'Stock by vehicle',
    `${tree.summary.makeCount} makes · each part listed once`
  );

  const w = contentWidth(doc);
  return drawDataTable(doc, y, {
    columns: [
      { key: 'part', label: 'Make / Part', width: w * 0.34, bold: true },
      { key: 'units', label: 'Units', width: w * 0.12, align: 'center' },
      { key: 'fits', label: 'Fits models', width: w * 0.38 },
      { key: 'low', label: 'Low', width: w * 0.16, align: 'center' },
    ],
    rows,
    emptyMessage: 'No vehicle fitments in inventory',
    highlightLowStock: true,
  });
}

const MOVEMENT_COLUMNS = (doc) => {
  const w = contentWidth(doc);
  return [
    { key: 'time', label: 'Time', width: w * 0.12 },
    { key: 'item', label: 'Item', width: w * 0.24, bold: true },
    { key: 'qr', label: 'QR ID', width: w * 0.18, linkKey: 'qrLink' },
    { key: 'qty', label: 'Qty', width: w * 0.08, align: 'center' },
    { key: 'details', label: 'Details', width: w * 0.38 },
  ];
};

const STOCK_COLUMNS = (doc) => {
  const w = contentWidth(doc);
  return [
    { key: 'item', label: 'Item / Vehicle', width: w * 0.34, bold: true },
    { key: 'qr', label: 'QR ID', width: w * 0.16, linkKey: 'qrLink' },
    { key: 'category', label: 'Category', width: w * 0.14 },
    { key: 'location', label: 'Location', width: w * 0.16 },
    { key: 'qty', label: 'Qty', width: w * 0.08, align: 'center' },
    { key: 'status', label: 'Status', width: w * 0.12 },
  ];
};

function mapMovementRow(tx) {
  const vehicle = formatVehicleFitments(tx.item || {});
  const itemLabel = vehicle
    ? `${tx.item?.name || 'Unknown item'}\n${vehicle}`
    : (tx.item?.name || 'Unknown item');
  return {
    time: formatMovementTime(tx.created_at),
    item: itemLabel,
    qr: tx.item?.qr_id || '—',
    qrLink: tx.item?.id ? getItemPageUrl(tx.item.id) : '',
    qty: String(tx.quantity ?? 1),
    details: formatMovementDetail(tx),
  };
}

function mapStockRow(item, orderDetails = null) {
  const vehicle = formatVehicleFitments(item);
  let itemLabel = vehicle ? `${item.name || '—'}\n${vehicle}` : (item.name || '—');
  const needsOrder = orderDetails?.itemIds?.has(item.id);
  const orderInfo = orderDetails?.modelsByItemId?.get(item.id);

  if (needsOrder && orderInfo?.models?.length) {
    itemLabel += `\nOrder: ${orderInfo.make} ${orderInfo.models.join(', ')}`;
  } else if (needsOrder && orderInfo && !orderInfo.make) {
    itemLabel += '\nOrder: unassigned part';
  }

  return {
    _lowStock: Boolean(needsOrder),
    item: itemLabel,
    qr: item.qr_id || '—',
    qrLink: item.id ? getItemPageUrl(item.id) : '',
    category: item.category || '—',
    location: item.store_location || '—',
    qty: String(item.quantity ?? 0),
    status: statusLabels[item.status] || item.status || '—',
  };
}

async function drawCompanyHeader(doc, title, subtitleLines = []) {
  const w = pageWidth(doc);
  let y = 10;
  const logoData = await resolveLogoDataUrl();

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', (w - 45) / 2, y, 45, 16);
    } catch {
      /* skip text fallback for inventory export */
    }
  }
  y += 22;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, w / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Asahi Motors Spare Parts Inventory System', w / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(...PDF_THEME.slate500);
  for (const line of subtitleLines) {
    doc.text(line, w / 2, y, { align: 'center' });
    y += 4;
  }

  doc.setTextColor(0, 0, 0);
  return y + 4;
}

export async function exportDailyReportPDF(items, exportedBy = '') {
  const stock = items || [];
  const tree = buildStockTree(stock);
  const modelOrderAlerts = tree.modelOrderAlerts;
  const orderDetails = getOrderAlertDetails(tree);
  const { checkIns, checkOuts, dateLabel } = await getTodayStockMovements();
  const sortedStock = [...stock].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const inQty = sumMovementQty(checkIns);
  const outQty = sumMovementQty(checkOuts);
  const generatedAt = new Date().toLocaleString();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = await drawDailyReportHeader(doc, { dateLabel, generatedAt });

  y = drawStatCards(doc, y, [
    {
      label: 'Stock out',
      value: outQty,
      sub: `${checkOuts.length} today`,
      accent: PDF_THEME.amber,
      bg: PDF_THEME.amberLight,
      color: PDF_THEME.amber,
    },
    {
      label: 'Stock in',
      value: inQty,
      sub: `${checkIns.length} today`,
      accent: PDF_THEME.green,
      bg: PDF_THEME.greenLight,
      color: PDF_THEME.green,
    },
    {
      label: 'Order alerts',
      value: modelOrderAlerts.length,
      sub: `models below ${LOW_STOCK_THRESHOLD}`,
      accent: PDF_THEME.red,
      bg: PDF_THEME.redLight,
      color: PDF_THEME.red,
    },
    {
      label: 'Total parts',
      value: stock.length,
      sub: 'in inventory',
      accent: PDF_THEME.brand,
      bg: PDF_THEME.brandLight,
      color: PDF_THEME.brandDark,
    },
  ]);

  y = drawSectionHeader(
    doc,
    y,
    "Today's activity",
    `${outQty} out · ${inQty} in`
  );
  y = drawSectionHeader(doc, y, 'Checked out', `${checkOuts.length} record${checkOuts.length === 1 ? '' : 's'}`);
  y = drawDataTable(doc, y, {
    columns: MOVEMENT_COLUMNS(doc),
    rows: checkOuts.map(mapMovementRow),
    emptyMessage: 'No check-outs recorded today',
  });
  y = drawSectionHeader(doc, y, 'Checked in', `${checkIns.length} record${checkIns.length === 1 ? '' : 's'}`);
  y = drawDataTable(doc, y, {
    columns: MOVEMENT_COLUMNS(doc),
    rows: checkIns.map(mapMovementRow),
    emptyMessage: 'No check-ins recorded today',
  });

  y = drawSectionHeader(
    doc,
    y,
    'Models to order',
    `${modelOrderAlerts.length} make/model${modelOrderAlerts.length === 1 ? '' : 's'} below ${LOW_STOCK_THRESHOLD} units total`
  );
  y = drawDataTable(doc, y, {
    columns: (() => {
      const w = contentWidth(doc);
      return [
        { key: 'vehicle', label: 'Make / Model', width: w * 0.38, bold: true },
        { key: 'total', label: 'Total', width: w * 0.12, align: 'center' },
        { key: 'parts', label: 'Parts checked', width: w * 0.22, align: 'center' },
        { key: 'action', label: 'Action', width: w * 0.28, align: 'center' },
      ];
    })(),
    rows: flattenModelOrderAlertRows(modelOrderAlerts),
    emptyMessage: 'All models have enough stock across compatible parts',
    highlightLowStock: true,
  });

  y = drawSectionHeader(doc, y, 'Current stock', `${stock.length} item${stock.length === 1 ? '' : 's'} total`);
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_THEME.slate500);
  y = ensurePageSpace(doc, y, 8);
  doc.text(
    `Rows highlighted in red = part linked to a make/model with less than ${LOW_STOCK_THRESHOLD} units total across all compatible parts`,
    PDF_THEME.margin,
    y
  );
  y += 5;
  y = drawDataTable(doc, y, {
    columns: STOCK_COLUMNS(doc),
    rows: sortedStock.map((item) => mapStockRow(item, orderDetails)),
    emptyMessage: 'No spare parts in inventory',
    highlightLowStock: true,
  });

  y = drawStockTreeSection(doc, y, stock);

  addPageFooters(doc, exportedBy);
  doc.save(`daily-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportInventoryPDF(items, categoryFilter = null, exportedBy = '') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 10;

  const logoData = await resolveLogoDataUrl();
  const logoW = 45;
  const logoH = 16;
  const logoX = (pageWidth - logoW) / 2;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', logoX, y, logoW, logoH);
    } catch {
      /* logo optional */
    }
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
      formatVehicleFitments(item).slice(0, 10) || '-',
    ];
    row.forEach((val, i) => {
      if (i === 1 && item.id) {
        const qrText = (item.qr_id || '').slice(0, 10);
        drawPdfText(doc, qrText, x, y, {
          url: getItemPageUrl(item.id),
          color: PDF_THEME.link,
        });
        doc.setTextColor(0, 0, 0);
      } else {
        doc.text(val, x, y);
      }
      x += colWidths[i];
    });
    y += 6;
  });

  addPageFooters(doc, exportedBy);

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
    Description: item.description || '',
    Category: item.category || '',
    'Store Location': item.store_location || '',
    Vehicles: formatVehicleFitments(item),
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
  const headers = ['Name', 'QR ID', 'Description', 'Category', 'Store Location', 'Vehicles', 'Quantity', 'Status', 'Added By', 'Added Date', 'Last Used By', 'Last Used'];
  const rows = items.map((item) => [
    `"${(item.name || '').replace(/"/g, '""')}"`,
    item.qr_id || '',
    `"${(item.description || '').replace(/"/g, '""')}"`,
    item.category || '',
    item.store_location || '',
    `"${formatVehicleFitments(item).replace(/"/g, '""')}"`,
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
