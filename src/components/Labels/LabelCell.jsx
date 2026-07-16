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
  const qrSize = isSmall ? (preview ? 92 : 36) : preview ? 120 : 56;
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

  const smallCodeClass = preview ? 'text-[9px]' : 'text-[5px]';

  return (
    <div
      className={`label-cell border border-dashed border-slate-300 bg-white overflow-hidden text-center ${
        isSmall
          ? preview
            ? 'relative flex flex-col justify-center p-1 gap-0.5 w-[54mm] h-[54mm] max-w-[54mm]'
            : 'relative flex flex-col justify-center p-0.5 gap-0 w-[54mm] h-[54mm]'
          : 'flex flex-col items-center justify-center ' +
            (preview ? 'p-4 gap-1.5 max-w-[220px] gap-0.5' : 'p-1.5 gap-0.5')
      }`}
      data-label-code={code}
      data-item-id={itemId}
      data-label-key={labelKey || itemId}
      data-label-variant={variant}
    >
      {isSmall ? (
        <>
          <p
            className={`label-code-vertical absolute right-[1px] inset-y-1 z-10 flex items-center justify-center font-mono text-slate-600 leading-none max-h-full overflow-hidden ${smallCodeClass}`}
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            title={code}
          >
            {code}
          </p>
          <div className="flex flex-col items-center w-full min-w-0 pr-2.5 gap-0.5">
            <p
              className={`font-semibold text-slate-800 leading-tight line-clamp-2 w-full px-0.5 ${
                preview ? 'text-[15px]' : 'text-[10px]'
              }`}
            >
              {name}
            </p>
            {fitments.length > 0 ? (
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
              <p className={`text-slate-600 leading-tight line-clamp-1 w-full px-0.5 ${preview ? 'text-[12px]' : 'text-[8px]'}`}>
                {vehicleModel}
              </p>
            ) : null}
            <div className="label-qr shrink-0">
              <QRCodeCanvas value={getQrCodeUrl(code)} size={qrSize} level="H" includeMargin={false} />
            </div>
            <canvas
              ref={barcodeRef}
              className={`label-barcode max-w-full shrink-0 ${preview ? 'h-7 mt-1.5' : 'h-3.5 mt-0.5'}`}
            />
          </div>
        </>
      ) : (
        <>
      <p
        className={`font-semibold text-slate-800 leading-tight line-clamp-2 w-full px-0.5 ${
          preview ? 'text-sm' : 'text-[9px] sm:text-[10px]'
        }`}
      >
        {name}
      </p>
      {vehicleModel ? (
        <p
          className={`text-slate-600 leading-tight line-clamp-1 w-full px-0.5 ${
            preview ? 'text-xs' : 'text-[7px]'
          }`}
        >
          {`Vehicle: ${vehicleModel}`}
        </p>
      ) : null}
      <div className="label-qr shrink-0 mt-0.5">
        <QRCodeCanvas value={getQrCodeUrl(code)} size={qrSize} level="H" includeMargin={false} />
      </div>
      <p
        className={`font-mono text-slate-600 leading-none truncate w-full px-0.5 ${
          preview ? 'text-xs' : 'text-[6px]'
        }`}
      >
        {code}
      </p>
      <canvas
        ref={barcodeRef}
        className={`label-barcode max-w-full ${preview ? 'h-12' : 'h-6'}`}
      />
        </>
      )}
    </div>
  );
}
