import { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Modal } from './ui/Modal';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { getAppLoginUrl } from '../lib/authRedirect';
import { useNotification } from '../context/NotificationContext';

export function AppLoginQrModal({ open, onClose }) {
  const { success, error: notifyError } = useNotification();
  const loginUrl = useMemo(() => (open ? getAppLoginUrl() : ''), [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      success('Login link copied');
    } catch {
      notifyError('Could not copy link');
    }
  };

  return (
    <Modal onBackdropClick={onClose}>
      <Card className="p-6 max-w-sm w-full mx-auto">
        <h3 className="font-semibold text-slate-800 text-lg">App login QR</h3>
        <p className="text-sm text-slate-500 mt-1">
          Scan or share this link so someone can open the spare parts app sign-in page.
        </p>
        <div className="flex flex-col items-center gap-4 mt-5">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <QRCodeCanvas value={loginUrl} size={180} level="H" includeMargin />
          </div>
          <p className="text-xs font-mono text-slate-600 break-all text-center px-2">{loginUrl}</p>
          <div className="flex flex-wrap gap-2 w-full">
            <Button type="button" className="flex-1" onClick={handleCopy}>
              Copy login link
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    </Modal>
  );
}
