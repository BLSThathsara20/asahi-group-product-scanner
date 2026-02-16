import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Button } from '../ui/Button';
import { getQrCodeUrl } from '../../lib/utils';

export function QRCodeDisplay({ qrId, itemName }) {
  const canvasRef = useRef(null);
  const qrValue = getQrCodeUrl(qrId);

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a6' });
    const pageW = doc.internal.pageSize.getWidth();
    const size = 60;
    const x = (pageW - size) / 2;

    doc.setFontSize(14);
    doc.text(itemName || qrId, pageW / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Product Code: ${qrId}`, pageW / 2, 18, { align: 'center' });

    const canvas = canvasRef.current?.querySelector('canvas');
    if (canvas) {
      const pngData = canvas.toDataURL('image/png');
      doc.addImage(pngData, 'PNG', x, 22, size, size);
    }
    doc.save(`QR-${qrId}.pdf`);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={canvasRef} className="p-4 bg-white rounded-xl border border-slate-200">
        <QRCodeCanvas value={qrValue} size={160} level="H" includeMargin />
      </div>
      <p className="font-mono text-sm font-medium text-slate-600">Product Code: {qrId}</p>
      <Button variant="outline" onClick={downloadPDF}>
        Download QR PDF
      </Button>
    </div>
  );
}
