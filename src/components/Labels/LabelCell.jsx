import { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { getQrCodeUrl } from '../../lib/utils';
import { normalizeVehicleFitments } from '../../lib/vehicleFitments';

export function LabelCell({
  itemId,
  labelKey,
  name,
  code,
  vehicleModel,
  vehicleFitments,
  preview = false,
  variant = 'standard',
}) {
  const barcodeRef = useRef(null);
  const isSmall = variant === 'small54';
  const fitments = vehicleFitments !== undefined
    ? normalizeVehicleFitments({ vehicle_fitments: vehicleFitments })
    : normalizeVehicleFitments({ vehicle_model: vehicleModel });
  const qrSize = isSmall ? (preview ? 72 : 36) : preview ? 120 : 56;
  const barcodeHeight = isSmall ? (preview ? 28 : 14) : preview ? 48 : 24;
  const barcodeWidth = isSmall ? (preview ? 1.1 : 0.9) : preview ? 1.8 : 1.2;

  useEffect(() => {
    if (!code || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, code, {
        format: 'CODE128',
        width: barcodeWidth,
        height: barcodeHeight,
        displayValue: false,
        margin: 0,
      });
    } catch {
      /* invalid barcode value */
    }
  }, [code, barcodeHeight, barcodeWidth]);

  if (!code) return null;

  return (
    <div
      className={`label-cell flex flex-col items-center justify-center border border-dashed border-slate-300 bg-white overflow-hidden text-center ${
        isSmall
          ? preview
            ? 'p-1 gap-0.5 w-[54mm] max-w-[54mm] aspect-square'
            : 'p-0.5 gap-0'
          : preview
            ? 'p-4 gap-1.5 max-w-[220px] gap-0.5'
            : 'p-1.5 gap-0.5'
      }`}
      data-label-code={code}
      data-item-id={itemId}
      data-label-key={labelKey || itemId}
      data-label-variant={variant}
    >
      <p
        className={`font-mono text-slate-600 leading-none truncate w-full px-0.5 ${
          isSmall
            ? preview
              ? 'text-[10px]'
              : 'text-[6px]'
            : preview
              ? 'text-xs'
              : 'text-[6px]'
        }`}
      >
        {code}
      </p>
      <p
        className={`font-semibold text-slate-800 leading-tight line-clamp-2 w-full px-0.5 ${
          isSmall ? (preview ? 'text-[15px]' : 'text-[10px]') : preview ? 'text-sm' : 'text-[9px] sm:text-[10px]'
        }`}
      >
        {name}
      </p>
      {isSmall && fitments.length > 0 ? (
        <div className="w-full px-0.5 space-y-0.5">
          {fitments.map((entry) => (
            <div key={entry.make}>
              <p className={`font-bold text-slate-800 leading-tight line-clamp-1 ${preview ? 'text-[12px]' : 'text-[8px]'}`}>
                {entry.make}
              </p>
              {entry.models.length > 0 ? (
                <p className={`text-slate-700 leading-tight line-clamp-2 ${preview ? 'text-[11px]' : 'text-[7px]'}`}>
                  {entry.models.map((model) => model.name).join(', ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : vehicleModel ? (
        <p
          className={`text-slate-600 leading-tight line-clamp-1 w-full px-0.5 ${
            isSmall ? (preview ? 'text-[12px]' : 'text-[8px]') : preview ? 'text-xs' : 'text-[7px]'
          }`}
        >
          {isSmall ? vehicleModel : `Vehicle: ${vehicleModel}`}
        </p>
      ) : null}
      <div className="label-qr shrink-0 mt-0.5">
        <QRCodeCanvas value={getQrCodeUrl(code)} size={qrSize} level="H" includeMargin={false} />
      </div>
      <canvas
        ref={barcodeRef}
        className={`label-barcode max-w-full ${isSmall ? (preview ? 'h-7' : 'h-3.5') : preview ? 'h-12' : 'h-6'}`}
      />
    </div>
  );
}
