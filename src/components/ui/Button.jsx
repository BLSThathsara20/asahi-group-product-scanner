export function Button({ children, variant = 'primary', className = '', loading = false, disabled, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-asahi text-white hover:bg-asahi-700',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    outline: 'border-2 border-asahi text-asahi hover:bg-asahi/10',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
