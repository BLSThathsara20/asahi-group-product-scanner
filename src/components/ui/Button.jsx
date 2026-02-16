export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-asahi text-white hover:bg-asahi-700',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    outline: 'border-2 border-asahi text-asahi hover:bg-asahi/10',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
