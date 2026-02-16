import { createPortal } from 'react-dom';

/**
 * Modal that renders via portal to document.body so it appears above fixed header (z-30).
 */
export function Modal({ children, onBackdropClick, overlayClass = 'bg-black/30' }) {
  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[100] ${overlayClass}`}
        onClick={onBackdropClick}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-24 pb-20 overflow-y-auto"
        onClick={onBackdropClick}
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}
