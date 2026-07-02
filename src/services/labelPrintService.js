import { jsPDF } from 'jspdf';

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
  if (item.vehicle_model) {
    const vehicleLine = truncateText(doc, `Vehicle: ${item.vehicle_model}`, innerW - 2);
    doc.text(vehicleLine, innerX + innerW / 2, cursorY, { align: 'center', maxWidth: innerW });
    cursorY += 2.5;
  }

  doc.setFontSize(4.5);
  doc.text('QR', innerX + innerW / 2, cursorY, { align: 'center' });
  cursorY += 1.5;

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

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.text('Barcode', innerX + innerW / 2, cursorY, { align: 'center' });
  cursorY += 1.5;

  const barW = innerW * 0.88;
  const barH = Math.min(h * 0.12, 8);
  const barX = innerX + (innerW - barW) / 2;
  const barY = cursorY;
  if (barcodeData) {
    doc.addImage(barcodeData, 'PNG', barX, barY, barW, barH);
  }
}

function getCellImages(itemId, pageIndex) {
  const page = document.querySelector(`[data-page-index="${pageIndex}"]`);
  const cell = page?.querySelector(`[data-item-id="${itemId}"]`) ||
    document.querySelector(`[data-item-id="${itemId}"]`);
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
      const { qrData, barcodeData } = getCellImages(item.id, pageIdx);
      drawLabelInCell(doc, item, qrData, barcodeData, col, row, COLS, rows);
    }
  }

  const slug = items.length === 1 ? items[0].qr_id : `${items.length}-items`;
  doc.save(`labels-${slug}.pdf`);
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
