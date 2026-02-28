import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
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

function normalizeRepeatedBarcode(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return trimmed;
  for (let len = 1; len <= Math.floor(trimmed.length / 2); len++) {
    if (trimmed.length % len !== 0) continue;
    const chunk = trimmed.slice(0, len);
    if (chunk.repeat(trimmed.length / len) === trimmed) return chunk;
  }
  return trimmed;
}

export function ScanModalProvider({ children }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const barcodeInputRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const globalBufferRef = useRef({ chars: '', lastKeyAt: 0 });
  const MIN_BARCODE_LEN = 4;

  const openScanModal = useCallback(() => {
    setCameraError('');
    setOpen(true);
  }, []);

  const openScanBarcodeModal = useCallback(() => {
    setBarcodeInput('');
    setBarcodeModalOpen(true);
  }, []);

  useEffect(() => {
    if (barcodeModalOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [barcodeModalOpen]);

  const processBarcodeRef = useRef(() => {});

  useEffect(() => {
    function onKeyDown(e) {
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      const isContentEditable = target?.isContentEditable;
      const isBarcodeInput = target?.getAttribute?.('data-barcode-input') === 'true';
      if (tag === 'input' || tag === 'textarea' || isContentEditable || isBarcodeInput) {
        globalBufferRef.current = { chars: '', lastKeyAt: 0 };
        return;
      }
      const now = Date.now();
      const buf = globalBufferRef.current;
      if (buf.chars && now - buf.lastKeyAt > 200) {
        buf.chars = '';
      }
      if (e.key === 'Enter') {
        if (buf.chars.length >= MIN_BARCODE_LEN) {
          e.preventDefault();
          e.stopPropagation();
          const barcode = buf.chars;
          buf.chars = '';
          buf.lastKeyAt = 0;
          processBarcodeRef.current(barcode);
        }
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buf.chars += e.key;
        buf.lastKeyAt = now;
        e.preventDefault();
        e.stopPropagation();
      } else {
        buf.chars = '';
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const closeScanModal = useCallback(async () => {
    try {
      await scannerRef.current?.stop?.();
    } catch {
      // ignore
    }
    setOpen(false);
  }, []);

  const closeBarcodeModal = useCallback(() => {
    setBarcodeModalOpen(false);
    setBarcodeInput('');
    setBarcodeSearching(false);
  }, []);

  const processBarcode = useCallback(
    async (barcode) => {
      const normalized = extractBarcode(normalizeRepeatedBarcode(barcode));
      if (!normalized) return;
      try {
        const item = await getItemByQrIdOrBase(normalized);
        closeBarcodeModal();
        if (!item) {
          navigate(`/inventory/add?barcode=${encodeURIComponent(normalized)}`);
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
        closeBarcodeModal();
        navigate(`/inventory/add?barcode=${encodeURIComponent(normalized)}`);
      }
    },
    [navigate, closeBarcodeModal]
  );

  useEffect(() => {
    processBarcodeRef.current = processBarcode;
  }, [processBarcode]);

  const handleBarcodeSearch = useCallback(
    async (rawValue) => {
      const barcode = extractBarcode(normalizeRepeatedBarcode(rawValue));
      if (!barcode) return;
      setBarcodeSearching(true);
      try {
        await processBarcode(barcode);
      } finally {
        setBarcodeSearching(false);
      }
    },
    [processBarcode]
  );

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
    <ScanModalContext.Provider value={{ openScanModal, openScanBarcodeModal }}>
      {children}
      {barcodeModalOpen && (
        <Modal onBackdropClick={closeBarcodeModal}>
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Scan Barcode</h3>
                <p className="text-sm text-slate-500 mt-1">Focus here, then scan with physical scanner or type manually</p>
              </div>
              <button
                type="button"
                onClick={closeBarcodeModal}
                className="p-2 -m-2 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close"
              >
                <NavIcon name="close" className="w-5 h-5" />
              </button>
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              data-barcode-input="true"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBarcodeSearch(e.target.value ?? barcodeInput);
                }
              }}
              placeholder="Scan or enter barcode..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none text-lg"
              autoComplete="off"
              disabled={barcodeSearching}
            />
            {barcodeSearching && (
              <p className="mt-2 text-sm text-slate-500">Searching...</p>
            )}
            <button
              type="button"
              onClick={() => handleBarcodeSearch(barcodeInput)}
              disabled={!barcodeInput.trim() || barcodeSearching}
              className="mt-4 w-full py-2.5 rounded-lg bg-asahi text-white font-medium hover:bg-asahi/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </Card>
        </Modal>
      )}
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
