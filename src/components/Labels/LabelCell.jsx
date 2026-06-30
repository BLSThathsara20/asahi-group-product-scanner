import { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { getQrCodeUrl } from '../../lib/utils';

export function LabelCell({ itemId, name, code }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (!code || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, code, {
        format: 'CODE128',
        width: 1.4,
        height: 28,
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
      className="label-cell flex flex-col items-center justify-center gap-1 p-2 border border-dashed border-slate-300 bg-white overflow-hidden text-center"
      data-label-code={code}
      data-item-id={itemId}
    >
      <p className="text-[9px] sm:text-[10px] font-semibold text-slate-800 leading-tight line-clamp-2 w-full px-0.5">
        {name}
      </p>
      <div className="label-qr shrink-0">
        <QRCodeCanvas value={getQrCodeUrl(code)} size={64} level="H" includeMargin={false} />
      </div>
      <canvas ref={barcodeRef} className="label-barcode max-w-full h-7" />
      <p className="text-[7px] font-mono text-slate-600 leading-none truncate w-full">{code}</p>
    </div>
  );
}
