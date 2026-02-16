import { DEVELOPER } from '../../lib/branding';

export function Footer() {
  return (
    <footer className="py-4 px-4 pb-20 md:pb-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
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
