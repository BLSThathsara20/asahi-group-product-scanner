import { jsPDF } from 'jspdf';
import { formatVehicleFitments, normalizeVehicleFitments } from '../lib/vehicleFitments';

const A4_W = 210;
const A4_H = 297;
const MARGIN = 8;
const COLS = 3;

function cellRect(col, row, cols, rows) {
  const usableW = A4_W - MARGIN * 2;
  const usableH = A4_H - MARGIN * 2;
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  return {
    x: MARGIN + col * cellW,
    y: MARGIN + row * cellH,
    w: cellW,
    h: cellH,
  };
}

function truncateText(doc, text, maxW) {
  let value = text || '';
  while (value.length > 0 && doc.getTextWidth(value) > maxW) {
    value = value.slice(0, -1);
  }
  return value.length < (text || '').length ? `${value}…` : value;
}

function drawLabelInCell(doc, item, qrData, barcodeData, col, row, cols, rows) {
  const code = item.qr_id;
  const { x, y, w, h } = cellRect(col, row, cols, rows);
  const pad = 2;
  const innerX = x + pad;
  let cursorY = y + pad + 3;
  const innerW = w - pad * 2;

  doc.setDrawColor(180);
  doc.rect(x, y, w, h);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const title = truncateText(doc, item.name || code, innerW - 2);
  doc.text(title, innerX + innerW / 2, cursorY, { align: 'center', maxWidth: innerW });
  cursorY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  if (item.category) {
    const catLine = truncateText(doc, `Category: ${item.category}`, innerW - 2);
    doc.text(catLine, innerX + innerW / 2, cursorY, { align: 'center', maxWidth: innerW });
    cursorY += 2.5;
  }
  if (item.vehicle_fitments?.length || item.vehicle_model) {
    const vehicleLine = truncateText(doc, `Vehicle: ${formatVehicleFitments(item)}`, innerW - 2);
    doc.text(vehicleLine, innerX + innerW / 2, cursorY, { align: 'center', maxWidth: innerW });
    cursorY += 2.5;
  }

  const qrSize = Math.min(innerW * 0.5, h * 0.28, 20);
  const qrX = innerX + (innerW - qrSize) / 2;
  const qrY = cursorY;
  if (qrData) {
    doc.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
  }
  cursorY = qrY + qrSize + 2;

  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  doc.text(truncateText(doc, code, innerW - 2), innerX + innerW / 2, cursorY, { align: 'center', maxWidth: innerW });
  cursorY += 3;

  const barW = innerW * 0.88;
  const barH = Math.min(h * 0.12, 8);
  const barX = innerX + (innerW - barW) / 2;
  const barY = cursorY;
  if (barcodeData) {
    doc.addImage(barcodeData, 'PNG', barX, barY, barW, barH);
  }
}

function getCellImages(labelKey, pageIndex) {
  const page = document.querySelector(`[data-page-index="${pageIndex}"]`);
  const cell = page?.querySelector(`[data-label-key="${labelKey}"]`) ||
    document.querySelector(`[data-label-key="${labelKey}"]`);
  if (!cell) return { qrData: null, barcodeData: null };

  return {
    qrData: cell.querySelector('.label-qr canvas')?.toDataURL('image/png') || null,
    barcodeData: cell.querySelector('.label-barcode')?.toDataURL('image/png') || null,
  };
}

/** Build A4 PDF — selected products packed on sheets (one label each, 3 per row). */
export async function downloadLabelsPdf(items, maxRows = 4) {
  if (!items?.length) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const labelsPerPage = COLS * maxRows;
  const pages = [];
  for (let i = 0; i < items.length; i += labelsPerPage) {
    pages.push(items.slice(i, i + labelsPerPage));
  }

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx += 1) {
    const pageItems = pages[pageIdx];
    if (pageIdx > 0) doc.addPage();

    const rows = Math.min(maxRows, Math.max(1, Math.ceil(pageItems.length / COLS)));

    for (let i = 0; i < pageItems.length; i += 1) {
      const item = pageItems[i];
      if (!item.qr_id) continue;

      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const labelKey = item.labelKey || item.id;
      const { qrData, barcodeData } = getCellImages(labelKey, pageIdx);
      drawLabelInCell(doc, item, qrData, barcodeData, col, row, COLS, rows);
    }
  }

  const slug = items.length === 1 ? items[0].qr_id : `${items.length}-items`;
  doc.save(`labels-${slug}.pdf`);
}

const SMALL_LABEL_MM = 54;
const SMALL_NAME_FONT = 14;
const SMALL_MAKE_FONT = 11;
const SMALL_MODELS_FONT = 10;

function drawSmallLabelPage(doc, item, qrData, barcodeData) {
  const code = item.qr_id;
  const fitments = normalizeVehicleFitments(item);
  const pad = 1.5;
  const innerW = SMALL_LABEL_MM - pad * 2;
  let cursorY = pad + 2.5;

  doc.setFontSize(SMALL_NAME_FONT);
  doc.setFont('helvetica', 'bold');
  const title = truncateText(doc, item.name || code, innerW - 1);
  doc.text(title, SMALL_LABEL_MM / 2, cursorY, { align: 'center', maxWidth: innerW });
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  if (item.category) {
    const catLine = truncateText(doc, `Category: ${item.category}`, innerW - 1);
    doc.text(catLine, SMALL_LABEL_MM / 2, cursorY, { align: 'center', maxWidth: innerW });
    cursorY += 2.4;
  }

  if (fitments.length) {
    for (const entry of fitments) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(SMALL_MAKE_FONT);
      const makeLine = truncateText(doc, entry.make, innerW - 1);
      doc.text(makeLine, SMALL_LABEL_MM / 2, cursorY, { align: 'center', maxWidth: innerW });
      cursorY += 3.8;

      if (entry.models.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(SMALL_MODELS_FONT);
        const modelsLine = truncateText(doc, entry.models.join(', '), innerW - 1);
        doc.text(modelsLine, SMALL_LABEL_MM / 2, cursorY, { align: 'center', maxWidth: innerW });
        cursorY += 3.6;
      }
    }
  } else if (item.vehicle_model) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(SMALL_MAKE_FONT);
    const vehicleLine = truncateText(doc, formatVehicleFitments(item), innerW - 1);
    doc.text(vehicleLine, SMALL_LABEL_MM / 2, cursorY, { align: 'center', maxWidth: innerW });
    cursorY += 3.8;
  }

  const barH = 8;
  const remainingH = SMALL_LABEL_MM - cursorY - barH - 1.5;
  const qrSize = Math.min(innerW * 0.62, Math.max(12, remainingH * 0.9), 16);
  const qrX = (SMALL_LABEL_MM - qrSize) / 2;
  const qrY = cursorY;
  if (qrData) {
    doc.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
  }
  cursorY = qrY + qrSize + 1.5;

  const barW = innerW * 0.92;
  const barX = (SMALL_LABEL_MM - barW) / 2;
  if (barcodeData) {
    doc.addImage(barcodeData, 'PNG', barX, cursorY, barW, barH);
  }
}

/** Single 54 x 54 mm label PDF for small thermal printers. */
export async function downloadSmallLabelPdf(item) {
  if (!item?.qr_id) return;

  await new Promise((resolve) => setTimeout(resolve, 400));
  const labelKey = `${item.labelKey || item.id}-small54`;
  const { qrData, barcodeData } = getCellImages(labelKey, 0);

  const doc = new jsPDF({
    unit: 'mm',
    format: [SMALL_LABEL_MM, SMALL_LABEL_MM],
    orientation: 'portrait',
  });
  drawSmallLabelPage(doc, item, qrData, barcodeData);
  doc.save(`label-54mm-${item.qr_id}.pdf`);
}

export function expandItemsWithQuantities(items, quantities = {}) {
  return items.flatMap((item) => {
    const raw = quantities[item.id] ?? 1;
    const count = Math.max(1, Math.min(99, Number(raw) || 1));
    return Array.from({ length: count }, (_, i) => ({
      ...item,
      labelKey: `${item.id}-${i}`,
    }));
  });
}

export function chunkItemsForPages(items, maxRows = 4) {
  const perPage = COLS * maxRows;
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}

export { COLS };
