import { useState } from 'react';
import { LabelCell } from './LabelCell';
import { Button } from '../ui/Button';
import { downloadLabelsPdf, downloadSmallLabelPdf } from '../../services/labelPrintService';
import { formatVehicleFitments } from '../../lib/vehicleFitments';

export function ItemLabelExport({ item }) {
  const [exportingA4, setExportingA4] = useState(false);
  const [exportingSmall, setExportingSmall] = useState(false);

  const handleDownloadA4 = async () => {
    if (!item?.qr_id) return;
    setExportingA4(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await downloadLabelsPdf([{ ...item, labelKey: item.id }], 1);
    } finally {
      setExportingA4(false);
    }
  };

  const handleDownloadSmall = async () => {
    if (!item?.qr_id) return;
    setExportingSmall(true);
    try {
      await downloadSmallLabelPdf({ ...item, labelKey: item.id });
    } finally {
      setExportingSmall(false);
    }
  };

  if (!item?.qr_id) return null;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col items-center gap-4 w-full">
        <p className="text-sm text-slate-500 text-center max-w-md">
          A4 label — part name, vehicle, QR code, and barcode (same as Print labels).
        </p>
        <div data-page-index="0" className="flex justify-center">
          <LabelCell
            itemId={item.id}
            labelKey={item.id}
            name={item.name}
            code={item.qr_id}
            vehicleModel={formatVehicleFitments(item)}
            preview
          />
        </div>
        <Button variant="outline" onClick={handleDownloadA4} disabled={exportingA4 || exportingSmall}>
          {exportingA4 ? 'Generating…' : 'Download A4 label PDF'}
        </Button>
      </div>

      <div className="flex flex-col items-center gap-4 w-full pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-500 text-center max-w-md">
          54 × 54 mm label for small thermal printers — part name, make | QR ID, models, QR code, and barcode.
        </p>
        <div className="flex justify-center">
          <LabelCell
            itemId={item.id}
            labelKey={`${item.id}-small54`}
            name={item.name}
            code={item.qr_id}
            vehicleModel={formatVehicleFitments(item)}
            vehicleFitments={item.vehicle_fitments}
            variant="small54"
            preview
          />
        </div>
        <Button variant="outline" onClick={handleDownloadSmall} disabled={exportingA4 || exportingSmall}>
          {exportingSmall ? 'Generating…' : 'Download 54mm label PDF'}
        </Button>
      </div>
    </div>
  );
}
