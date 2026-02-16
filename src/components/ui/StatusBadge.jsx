const statusConfig = {
  in_stock: { label: 'In Stock', className: 'bg-emerald-100 text-emerald-800' },
  out: { label: 'Out', className: 'bg-amber-100 text-amber-800' },
  reserved: { label: 'Reserved', className: 'bg-blue-100 text-blue-800' },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-800' };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
