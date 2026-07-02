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
      await downloadLabelsPdf([item], 1);
    } finally {
      setExporting(false);
    }
  };

  if (!item?.qr_id) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <LabelCell
        itemId={item.id}
        name={item.name}
        code={item.qr_id}
        category={item.category}
        vehicleModel={item.vehicle_model}
        preview
      />
      <Button variant="outline" onClick={handleDownload} disabled={exporting}>
        {exporting ? 'Generating…' : 'Download label PDF'}
      </Button>
    </div>
  );
}
