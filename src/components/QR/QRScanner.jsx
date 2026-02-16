import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScanner({ onScan, onError, scannerId = 'qr-reader' }) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5QrRef.current?.isScanning) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScan = async () => {
    try {
      const html5Qr = new Html5Qrcode(scannerId);
      html5QrRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScan();
        },
        () => {}
      );
      setIsScanning(true);
      scannerRef.current = html5Qr;
    } catch (err) {
      onError?.(err.message || 'Camera access denied');
    }
  };

  const stopScan = async () => {
    if (html5QrRef.current?.isScanning) {
      await html5QrRef.current.stop();
      html5QrRef.current.clear();
    }
    setIsScanning(false);
  };

  return (
    <div className="space-y-4">
      <div
        id={scannerId}
        className={`rounded-xl overflow-hidden border-2 ${
          isScanning ? 'border-asahi' : 'border-slate-200'
        }`}
        style={{ maxWidth: 400 }}
      />
      <div className="flex gap-2">
        {!isScanning ? (
          <button
            onClick={startScan}
            className="px-4 py-2 bg-asahi text-white rounded-lg font-medium hover:bg-asahi-700"
          >
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopScan}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-medium hover:bg-slate-300"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
