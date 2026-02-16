import { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { Button } from '../ui/Button';

export function BarcodeDisplay({ barcodeId, itemName }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!barcodeId || !canvasRef.current) return;
    try {
      JsBarcode(canvasRef.current, barcodeId, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    } catch (err) {
      console.warn('Barcode render failed:', err);
    }
  }, [barcodeId]);

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a6' });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.text(itemName || barcodeId, pageW / 2, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Product Code: ${barcodeId}`, pageW / 2, 18, { align: 'center' });

    const canvas = canvasRef.current;
    if (canvas) {
      const pngData = canvas.toDataURL('image/png');
      const imgW = 80;
      const imgH = 40;
      doc.addImage(pngData, 'PNG', (pageW - imgW) / 2, 24, imgW, imgH);
    }
    doc.save(`Barcode-${barcodeId}.pdf`);
  };

  if (!barcodeId) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <canvas ref={canvasRef} />
      </div>
      <p className="font-mono text-sm font-medium text-slate-600">Product Code: {barcodeId}</p>
      <Button variant="outline" onClick={downloadPDF}>
        Download Barcode PDF
      </Button>
    </div>
  );
}
