import { FORM_SECTION_ACCENTS } from '../../lib/formFieldStyles';

export function FormField({
	variant = 'default',
	label,
	children,
	hint,
	required = false,
	className = '',
}) {
	const accent = FORM_SECTION_ACCENTS[variant] || FORM_SECTION_ACCENTS.default;

	return (
		<div
			className={`rounded-xl border border-slate-200/80 border-l-4 px-3 py-3 sm:px-4 ${accent} ${className}`}
		>
			{label && (
				<label className="block text-sm font-semibold text-slate-800 mb-2">
					{label}
					{required ? <span className="text-asahi"> *</span> : null}
				</label>
			)}
			{children}
			{hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
		</div>
	);
}
