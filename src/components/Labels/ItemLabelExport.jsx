import { useState } from 'react';
import { LabelCell } from './LabelCell';
import { Button } from '../ui/Button';
import { downloadLabelsPdf } from '../../services/labelPrintService';

export function ItemLabelExport({ item }) {
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (!item?.qr_id) return;
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await downloadLabelsPdf([{ ...item, labelKey: item.id }], 1);
    } finally {
      setExporting(false);
    }
  };

  if (!item?.qr_id) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-slate-500 text-center max-w-md">
        One label with part name, category, vehicle, QR code, and barcode — same layout as Print labels.
      </p>
      <div data-page-index="0" className="flex justify-center">
        <LabelCell
          itemId={item.id}
          labelKey={item.id}
          name={item.name}
          code={item.qr_id}
          category={item.category}
          vehicleModel={item.vehicle_model}
          preview
        />
      </div>
      <Button variant="outline" onClick={handleDownload} disabled={exporting}>
        {exporting ? 'Generating…' : 'Download label PDF'}
      </Button>
    </div>
  );
}
