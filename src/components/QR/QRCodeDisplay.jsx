import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Button } from '../ui/Button';

export function QRCodeDisplay({ qrId, itemName }) {
  const canvasRef = useRef(null);

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a6' });
    const size = 60;
    const x = (doc.internal.pageSize.getWidth() - size) / 2;
    const y = 20;

    doc.setFontSize(14);
    doc.text(itemName || qrId, doc.internal.pageSize.getWidth() / 2, 15, {
      align: 'center',
    });
    doc.setFontSize(10);
    doc.text(qrId, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });

    const canvas = canvasRef.current?.querySelector('canvas');
    if (canvas) {
      const pngData = canvas.toDataURL('image/png');
      doc.addImage(pngData, 'PNG', x, y + 10, size, size);
    }
    doc.save(`QR-${qrId}.pdf`);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={canvasRef} className="p-4 bg-white rounded-xl border border-slate-200">
        <QRCodeCanvas value={qrId} size={160} level="H" includeMargin />
      </div>
      <p className="font-mono text-sm font-medium text-slate-600">{qrId}</p>
      <Button variant="outline" onClick={downloadPDF}>
        Download PDF
      </Button>
    </div>
  );
}
