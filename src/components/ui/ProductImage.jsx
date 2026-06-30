import { useState, useEffect, useRef, useCallback } from 'react';
import { NavIcon } from '../icons/NavIcons';

/**
 * Product photo with pulse skeleton while the image loads from the network.
 */
export function ProductImage({
  src,
  alt = '',
  className = '',
  imgClassName = 'w-full h-full object-cover',
  fallbackIcon = 'package',
  iconClassName = 'w-8 h-8',
  priority = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const markLoadedIfReady = useCallback(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
      setError(false);
    }
  }, []);

  useEffect(() => {
    markLoadedIfReady();
  }, [src, markLoadedIfReady]);

  if (!src || error) {
    return (
      <div
        className={`bg-slate-200 flex items-center justify-center text-slate-400 ${className}`}
        role="img"
        aria-label={alt || 'No image'}
      >
        <NavIcon name={fallbackIcon} className={iconClassName} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" aria-hidden="true" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        className={`${imgClassName} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

/** Spinner overlay for image upload in progress. */
export function ImageUploadOverlay({ show, label = 'Uploading...' }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/45 text-white rounded-[inherit]">
      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}
