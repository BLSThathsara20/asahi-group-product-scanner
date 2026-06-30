import { NavIcon } from '../icons/NavIcons';

export const filterInputClass =
	'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-asahi/40 focus:border-asahi/50 outline-none';

export const filterSelectClass =
	'px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-asahi/40 outline-none';

const WIDTHS = {
	default: 'max-w-4xl',
	narrow: 'max-w-xl',
	wide: 'max-w-6xl',
	full: 'max-w-none',
};

export function PageContainer({ children, width = 'default', className = '' }) {
	return (
		<div className={`space-y-6 ${WIDTHS[width] || WIDTHS.default} ${className}`}>
			{children}
		</div>
	);
}

export function PageHeader({ title, subtitle, action, onBack, backLabel = 'Back' }) {
	return (
		<header className="space-y-3">
			{onBack && (
				<button
					type="button"
					onClick={onBack}
					className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
				>
					← {backLabel}
				</button>
			)}
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
						{title}
					</h1>
					{subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
				</div>
				{action && <div className="shrink-0">{action}</div>}
			</div>
		</header>
	);
}

export function SegmentPills({ options, value, onChange }) {
	return (
		<div className="inline-flex p-1 bg-slate-100 rounded-lg">
			{options.map((opt) => (
				<button
					key={opt.id}
					type="button"
					onClick={() => onChange(opt.id)}
					className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
						value === opt.id
							? 'bg-white text-slate-800 shadow-sm'
							: 'text-slate-500 hover:text-slate-700'
					}`}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}

export function StatBlock({ label, value, tone = 'default' }) {
	const tones = {
		default: 'text-slate-800',
		success: 'text-emerald-600',
		warn: 'text-amber-600',
	};
	return (
		<div>
			<p className="text-xs text-slate-500">{label}</p>
			<p className={`text-2xl sm:text-3xl font-semibold tabular-nums mt-1 ${tones[tone] || tones.default}`}>
				{value}
			</p>
		</div>
	);
}

export function EmptyState({ icon = 'package', title, description, action }) {
	return (
		<div className="py-12 px-4 text-center">
			<div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
				<NavIcon name={icon} className="w-6 h-6" />
			</div>
			<p className="text-sm font-medium text-slate-600">{title}</p>
			{description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

export function PageSkeleton({ variant = 'default' }) {
	if (variant === 'table') {
		return (
			<div className="space-y-4 animate-pulse">
				<div className="h-8 w-48 bg-slate-200 rounded-lg" />
				<div className="h-12 bg-slate-200 rounded-xl" />
				<div className="h-64 bg-slate-200 rounded-xl" />
			</div>
		);
	}

	if (variant === 'detail') {
		return (
			<div className="space-y-6 animate-pulse">
				<div className="h-5 w-20 bg-slate-200 rounded" />
				<div className="h-32 bg-slate-200 rounded-xl" />
				<div className="h-48 bg-slate-200 rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-pulse">
			<div className="space-y-2">
				<div className="h-8 w-52 bg-slate-200 rounded-lg" />
				<div className="h-4 w-36 bg-slate-100 rounded" />
			</div>
			<div className="h-32 bg-slate-200 rounded-xl" />
			<div className="h-48 bg-slate-200 rounded-xl" />
		</div>
	);
}

export function AuthShell({ title, subtitle, children }) {
	return (
		<div className="min-h-screen flex flex-col bg-slate-50">
			<div className="flex-1 flex items-center justify-center p-4 sm:p-6">
				<div className="w-full max-w-md">
					<div className="text-center mb-8">
						<p className="text-2xl font-semibold text-slate-800 tracking-tight">{title}</p>
						{subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
					</div>
					{children}
				</div>
			</div>
		</div>
	);
}
