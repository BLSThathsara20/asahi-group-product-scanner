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
  category,
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
        className={`font-semibold text-slate-800 leading-tight line-clamp-2 w-full px-0.5 ${
          isSmall ? (preview ? 'text-[22px]' : 'text-[14px]') : preview ? 'text-sm' : 'text-[9px] sm:text-[10px]'
        }`}
      >
        {name}
      </p>
      {category && !isSmall ? (
        <p
          className={`text-slate-600 leading-tight line-clamp-1 w-full px-0.5 ${
            preview ? 'text-xs' : 'text-[7px]'
          }`}
        >
          Category: {category}
        </p>
      ) : null}
      {isSmall && category ? (
        <p className={`text-slate-500 leading-tight line-clamp-1 w-full px-0.5 ${preview ? 'text-[8px]' : 'text-[5.5px]'}`}>
          {category}
        </p>
      ) : null}
      {isSmall && fitments.length > 0 ? (
        <div className="w-full px-0.5 space-y-0.5">
          {fitments.map((entry) => (
            <div key={entry.make}>
              <p className={`font-bold text-slate-800 leading-tight line-clamp-1 ${preview ? 'text-[18px]' : 'text-[11px]'}`}>
                {entry.make}
              </p>
              {entry.models.length > 0 ? (
                <p className={`text-slate-700 leading-tight line-clamp-2 ${preview ? 'text-[16px]' : 'text-[10px]'}`}>
                  {entry.models.join(', ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : vehicleModel ? (
        <p
          className={`text-slate-600 leading-tight line-clamp-1 w-full px-0.5 ${
            isSmall ? (preview ? 'text-[18px]' : 'text-[11px]') : preview ? 'text-xs' : 'text-[7px]'
          }`}
        >
          {isSmall ? vehicleModel : `Vehicle: ${vehicleModel}`}
        </p>
      ) : null}
      <div className="label-qr shrink-0 mt-0.5">
        <QRCodeCanvas value={getQrCodeUrl(code)} size={qrSize} level="H" includeMargin={false} />
      </div>
      {!isSmall ? (
        <p
          className={`font-mono text-slate-600 leading-none truncate w-full px-0.5 ${
            preview ? 'text-xs' : 'text-[6px]'
          }`}
        >
          {code}
        </p>
      ) : null}
      <canvas
        ref={barcodeRef}
        className={`label-barcode max-w-full ${isSmall ? (preview ? 'h-7' : 'h-3.5') : preview ? 'h-12' : 'h-6'}`}
      />
    </div>
  );
}
