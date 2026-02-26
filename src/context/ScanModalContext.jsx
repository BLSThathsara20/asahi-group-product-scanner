import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemByQrIdOrBase } from '../services/itemService';
import { QRScanner } from '../components/QR/QRScanner';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { NavIcon } from '../components/icons/NavIcons';

const ScanModalContext = createContext(null);

export function useScanModal() {
  const ctx = useContext(ScanModalContext);
  if (!ctx) throw new Error('useScanModal must be used within ScanModalProvider');
  return ctx;
}

function extractBarcode(value) {
  const trimmed = String(value || '').trim();
  try {
    const url = new URL(trimmed);
    const b = url.searchParams.get('barcode');
    return b || trimmed;
  } catch {
    return trimmed;
  }
}

export function ScanModalProvider({ children }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);

  const openScanModal = useCallback(() => {
    setCameraError('');
    setOpen(true);
  }, []);

  const closeScanModal = useCallback(async () => {
    try {
      await scannerRef.current?.stop?.();
    } catch {
      // ignore
    }
    setOpen(false);
  }, []);

  const handleScan = useCallback(
    async (decoded) => {
      const trimmed = extractBarcode(decoded);
      if (!trimmed) return;
      setOpen(false);
      try {
        const item = await getItemByQrIdOrBase(trimmed);
        if (!item) {
          navigate(`/inventory/add?barcode=${encodeURIComponent(trimmed)}`);
          return;
        }
        if (item.status === 'in_stock') {
          navigate(`/inventory/${item.id}?checkout=1`);
        } else if (item.status === 'out') {
          navigate(`/inventory/${item.id}?checkin=1`);
        } else {
          navigate(`/inventory/${item.id}`);
        }
      } catch {
        navigate(`/inventory/add?barcode=${encodeURIComponent(trimmed)}`);
      }
    },
    [navigate]
  );

  return (
    <ScanModalContext.Provider value={{ openScanModal }}>
      {children}
      {open && (
        <Modal onBackdropClick={closeScanModal}>
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Scan QR or Barcode</h3>
                <p className="text-sm text-slate-500 mt-1">Hold steady, ensure good lighting for best results</p>
              </div>
              <button
                type="button"
                onClick={closeScanModal}
                className="p-2 -m-2 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close"
              >
                <NavIcon name="close" className="w-5 h-5" />
              </button>
            </div>
            <QRScanner
              ref={scannerRef}
              scannerId="scan-modal-scanner"
              onScan={handleScan}
              onError={setCameraError}
              autoStart
            />
            {cameraError && (
              <p className="mt-4 text-amber-600 text-sm">
                Camera: {cameraError}. Ensure HTTPS or localhost.
              </p>
            )}
          </Card>
        </Modal>
      )}
    </ScanModalContext.Provider>
  );
}
