import { DEVELOPER } from '../../lib/branding';

export function Footer() {
  return (
    <footer className="py-6 mt-6 text-center text-xs text-slate-500">
      <p>
        Developed by{' '}
        <a
          href={DEVELOPER.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-asahi hover:underline"
        >
          {DEVELOPER.name}
        </a>
      </p>
    </footer>
  );
}
