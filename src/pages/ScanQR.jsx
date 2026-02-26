import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getItemByQrIdOrBase } from '../services/itemService';
import { useScanModal } from '../context/ScanModalContext';

/** Handles /scan URL: with ?barcode= does lookup & redirect; without opens scan modal */
export function ScanQR() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openScanModal } = useScanModal();

  useEffect(() => {
    const barcode = searchParams.get('barcode');
    if (barcode?.trim()) {
      getItemByQrIdOrBase(barcode.trim())
        .then((item) => {
          if (!item) {
            navigate(`/inventory/add?barcode=${encodeURIComponent(barcode.trim())}`, { replace: true });
          } else if (item.status === 'in_stock') {
            navigate(`/inventory/${item.id}?checkout=1`, { replace: true });
          } else if (item.status === 'out') {
            navigate(`/inventory/${item.id}?checkin=1`, { replace: true });
          } else {
            navigate(`/inventory/${item.id}`, { replace: true });
          }
        })
        .catch(() => {
          navigate(`/inventory/add?barcode=${encodeURIComponent(barcode.trim())}`, { replace: true });
        });
    } else {
      openScanModal();
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate, openScanModal]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="animate-pulse text-slate-500">Opening...</div>
    </div>
  );
}
