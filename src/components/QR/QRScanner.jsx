import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { NavIcon } from '../icons/NavIcons';

export const QRScanner = forwardRef(function QRScanner(
  { onScan, onError, scannerId = 'qr-reader', autoStart = false, showTorchButton = true },
  ref
) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const startScan = async () => {
    if (autoStart) setIsLoading(true);
    setError(null);
    try {
      const html5Qr = new Html5Qrcode(scannerId);
      html5QrRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 5,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const w = Math.min(320, Math.floor(viewfinderWidth * 0.9));
            const h = Math.min(220, Math.floor(viewfinderHeight * 0.55));
            return { width: w, height: h };
          },
          aspectRatio: 4 / 3,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScan();
        },
        () => {}
      );
      setIsScanning(true);
      scannerRef.current = html5Qr;
      try {
        const caps = html5Qr.getRunningTrackCameraCapabilities?.();
        const torch = caps?.torchFeature?.();
        setTorchSupported(torch?.isSupported?.() ?? false);
      } catch {
        setTorchSupported(false);
      }
    } catch (err) {
      const msg = err.message || 'Camera access denied';
      setError(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const stopScan = async () => {
    if (html5QrRef.current?.isScanning) {
      await html5QrRef.current.stop();
      html5QrRef.current.clear();
      html5QrRef.current = null;
    }
    setIsScanning(false);
    setTorchSupported(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    const html5Qr = html5QrRef.current;
    if (!html5Qr?.isScanning) return;
    try {
      const caps = html5Qr.getRunningTrackCameraCapabilities?.();
      const torch = caps?.torchFeature?.();
      if (torch?.isSupported?.()) {
        const next = !torchOn;
        await torch.apply(next);
        setTorchOn(next);
      }
    } catch {
      // Torch not supported or failed
    }
  };

  useImperativeHandle(ref, () => ({ stop: stopScan }), []);

  useEffect(() => {
    return () => {
      if (html5QrRef.current?.isScanning) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (autoStart) {
      const t = setTimeout(() => startScan(), 150);
      return () => clearTimeout(t);
    }
  }, [autoStart]);

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-xl overflow-hidden border-2 ${
          isScanning ? 'border-asahi' : 'border-slate-200'
        }`}
        style={{ maxWidth: 400, minHeight: 250 }}
      >
        {showTorchButton && torchSupported && isScanning && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`absolute top-2 right-2 z-20 p-2 rounded-lg transition-colors ${
              torchOn ? 'bg-amber-400 text-amber-900' : 'bg-white/90 text-slate-600 hover:bg-white'
            }`}
            title={torchOn ? 'Flash off' : 'Flash on'}
            aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'}
          >
            <NavIcon name="flashlight" className="w-5 h-5" />
          </button>
        )}
        <div id={scannerId} />
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100">
            <div className="w-10 h-10 border-4 border-asahi border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-slate-600">Starting camera...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 p-4">
            <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            <button
              onClick={() => { setError(null); startScan(); }}
              className="mt-3 px-4 py-2 bg-asahi text-white rounded-lg font-medium hover:bg-asahi-700 text-sm"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      {!autoStart && (
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
      )}
    </div>
  );
});
