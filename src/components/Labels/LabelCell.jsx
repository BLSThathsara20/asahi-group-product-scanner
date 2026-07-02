import { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { getQrCodeUrl } from '../../lib/utils';

export function LabelCell({ itemId, name, code, category, vehicleModel }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (!code || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, code, {
        format: 'CODE128',
        width: 1.2,
        height: 24,
        displayValue: false,
        margin: 0,
      });
    } catch {
      /* invalid barcode value */
    }
  }, [code]);

  if (!code) return null;

  return (
    <div
      className="label-cell flex flex-col items-center justify-center gap-0.5 p-1.5 border border-dashed border-slate-300 bg-white overflow-hidden text-center"
      data-label-code={code}
      data-item-id={itemId}
    >
      <p className="text-[9px] sm:text-[10px] font-semibold text-slate-800 leading-tight line-clamp-2 w-full px-0.5">
        {name}
      </p>
      {category ? (
        <p className="text-[7px] text-slate-600 leading-tight line-clamp-1 w-full px-0.5">
          Category: {category}
        </p>
      ) : null}
      {vehicleModel ? (
        <p className="text-[7px] text-slate-600 leading-tight line-clamp-1 w-full px-0.5">
          Vehicle: {vehicleModel}
        </p>
      ) : null}
      <p className="text-[6px] font-medium uppercase tracking-wide text-slate-500 mt-0.5">QR</p>
      <div className="label-qr shrink-0">
        <QRCodeCanvas value={getQrCodeUrl(code)} size={56} level="H" includeMargin={false} />
      </div>
      <p className="text-[6px] font-mono text-slate-600 leading-none truncate w-full px-0.5">{code}</p>
      <p className="text-[6px] font-medium uppercase tracking-wide text-slate-500 mt-0.5">Barcode</p>
      <canvas ref={barcodeRef} className="label-barcode max-w-full h-6" />
    </div>
  );
}
