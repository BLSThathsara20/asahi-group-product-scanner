import { formInputClass } from '../../lib/formFieldStyles';

export function Input({ label, error, variant = 'default', className = '', inputClassName = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`${formInputClass(variant, inputClassName)} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
