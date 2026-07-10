/** Color-coded field styles for add/edit part forms. */

const BASE =
	'w-full px-4 py-2 border-2 rounded-lg outline-none transition-all duration-150 disabled:bg-slate-50 disabled:opacity-70';

export const FORM_FIELD_VARIANTS = {
	default:
		'border-slate-200 bg-white focus:border-asahi focus:ring-2 focus:ring-asahi/25',
	name: 'border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
	agl: 'border-amber-300 bg-amber-50/60 focus:border-amber-500 focus:ring-2 focus:ring-amber-200',
	description:
		'border-violet-300 bg-violet-50/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
	category:
		'border-fuchsia-300 bg-fuchsia-50/40 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200',
	location:
		'border-sky-300 bg-sky-50/50 focus:border-sky-500 focus:ring-2 focus:ring-sky-200',
	vehicle:
		'border-emerald-300 bg-emerald-50/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200',
	quantity:
		'border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200',
	price: 'border-teal-300 bg-teal-50/50 focus:border-teal-500 focus:ring-2 focus:ring-teal-200',
	date: 'border-indigo-300 bg-indigo-50/40 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
	barcode:
		'border-slate-300 bg-slate-50 focus:border-slate-500 focus:ring-2 focus:ring-slate-200',
	photo: 'border-orange-300 bg-orange-50/40 focus:border-orange-500 focus:ring-2 focus:ring-orange-200',
};

export const FORM_SECTION_ACCENTS = {
	default: 'border-l-slate-400 bg-slate-50/40',
	name: 'border-l-blue-500 bg-blue-50/35',
	agl: 'border-l-amber-500 bg-amber-50/40',
	description: 'border-l-violet-500 bg-violet-50/30',
	category: 'border-l-fuchsia-500 bg-fuchsia-50/30',
	location: 'border-l-sky-500 bg-sky-50/35',
	vehicle: 'border-l-emerald-500 bg-emerald-50/35',
	quantity: 'border-l-rose-500 bg-rose-50/30',
	price: 'border-l-teal-500 bg-teal-50/35',
	date: 'border-l-indigo-500 bg-indigo-50/30',
	barcode: 'border-l-slate-500 bg-slate-50/50',
	photo: 'border-l-orange-500 bg-orange-50/35',
};

export function formInputClass(variant = 'default', extra = '') {
	const tone = FORM_FIELD_VARIANTS[variant] || FORM_FIELD_VARIANTS.default;
	return `${BASE} ${tone} ${extra}`.trim();
}

export function formSelectClass(variant = 'default', extra = '') {
	return formInputClass(variant, extra);
}

export function formTextareaClass(variant = 'default', extra = '') {
	return `${formInputClass(variant, extra)} min-h-[88px] resize-y`;
}
