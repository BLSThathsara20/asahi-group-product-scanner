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
        className="fixed inset-0 z-[100] flex items-start justify-center p-4 pb-20 overflow-y-auto"
        style={{ paddingTop: 'max(6rem, calc(env(safe-area-inset-top, 0px) + 5rem))' }}
        onClick={onBackdropClick}
      >
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md shrink-0">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}
