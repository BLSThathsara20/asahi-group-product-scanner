import { useState } from 'react';
import { LOGO_URL } from '../../lib/branding';

export function Logo({ className = '', alt = 'AsahiGroup', fallbackText }) {
  const [errored, setErrored] = useState(false);

  if (errored && fallbackText) {
    return <span className={`font-bold text-asahi ${className}`}>{fallbackText}</span>;
  }

  return (
    <img
      src={LOGO_URL}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
    />
  );
}
