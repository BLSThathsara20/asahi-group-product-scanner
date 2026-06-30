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

/** Build A4 PDF — one page per item, grid of QR + barcode labels. */
export async function downloadLabelsPdf(items, rows = 4) {
  if (!items?.length) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const cols = COLS;
  const labelsPerPage = cols * rows;

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const item = items[itemIndex];
    const code = item.qr_id;
    if (!code) continue;

    if (itemIndex > 0) doc.addPage();

    const sheets = document.querySelectorAll(`[data-item-id="${item.id}"] .label-cell`);
    const firstCell = sheets[0];
    if (!firstCell) continue;

    const qrCanvas = firstCell.querySelector('.label-qr canvas');
    const barcodeCanvas = firstCell.querySelector('.label-barcode');
    const qrData = qrCanvas?.toDataURL('image/png');
    const barcodeData = barcodeCanvas?.toDataURL('image/png');

    for (let i = 0; i < labelsPerPage; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const { x, y, w, h } = cellRect(col, row, cols, rows);
      const pad = 2;
      const innerX = x + pad;
      const innerY = y + pad;
      const innerW = w - pad * 2;

      doc.setDrawColor(180);
      doc.rect(x, y, w, h);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      const title = truncateText(doc, item.name || code, innerW - 2);
      doc.text(title, innerX + innerW / 2, innerY + 4, { align: 'center', maxWidth: innerW });

      const qrSize = Math.min(innerW * 0.55, h * 0.38, 22);
      const qrX = innerX + (innerW - qrSize) / 2;
      const qrY = innerY + 6;
      if (qrData) {
        doc.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      const barW = innerW * 0.88;
      const barH = Math.min(h * 0.14, 10);
      const barX = innerX + (innerW - barW) / 2;
      const barY = qrY + qrSize + 2;
      if (barcodeData) {
        doc.addImage(barcodeData, 'PNG', barX, barY, barW, barH);
      }

      doc.setFont('courier', 'normal');
      doc.setFontSize(5.5);
      doc.text(code, innerX + innerW / 2, barY + barH + 3, { align: 'center', maxWidth: innerW });
    }
  }

  const slug = items.length === 1 ? items[0].qr_id : `${items.length}-items`;
  doc.save(`labels-${slug}.pdf`);
}
