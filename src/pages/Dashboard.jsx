import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import { getDashboardActivityStats, getRecentActivity } from "../services/analyticsService";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Dashboard() {
	const { items, loading } = useItems();
	const [activity, setActivity] = useState(null);
	const [activityPeriod, setActivityPeriod] = useState(() => {
		try {
			const saved = localStorage.getItem('dashboard-activity-period');
			if (saved === 'today' || saved === 'week' || saved === 'month') return saved;
		} catch {}
		return 'week';
	});

	const handleActivityPeriodChange = (value) => {
		setActivityPeriod(value);
		try {
			localStorage.setItem('dashboard-activity-period', value);
		} catch {}
	};

	useEffect(() => {
		getDashboardActivityStats()
			.then(setActivity)
			.catch(() => setActivity(null));
	}, []);

	const [recentActivity, setRecentActivity] = useState([]);
	const [recentTotal, setRecentTotal] = useState(0);
	const [recentPage, setRecentPage] = useState(1);
	const PAGE_SIZE = 5;
	const [recentLoading, setRecentLoading] = useState(false);

	const loadRecentActivity = useCallback((page) => {
		setRecentLoading(true);
		getRecentActivity(PAGE_SIZE, (page - 1) * PAGE_SIZE)
			.then(({ data, total }) => {
				setRecentActivity(data);
				setRecentTotal(total);
			})
			.catch(() => {
				setRecentActivity([]);
				setRecentTotal(0);
			})
			.finally(() => setRecentLoading(false));
	}, []);

	useEffect(() => {
		loadRecentActivity(recentPage);
	}, [recentPage, loadRecentActivity]);

	const totalPages = Math.max(1, Math.ceil(recentTotal / PAGE_SIZE));
	const hasPrev = recentPage > 1;
	const hasNext = recentPage < totalPages;

	const inStock = items.filter((i) => i.status === "in_stock").length;
	const out = items.filter((i) => i.status === "out").length;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-pulse text-slate-400">Loading...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

			<div className="grid grid-cols-3 gap-2 sm:gap-4">
				<Card className="p-3 sm:p-6 text-center">
					<p className="text-xs sm:text-sm text-slate-500 truncate">Total Spare Parts</p>
					<p className="text-xl sm:text-3xl font-bold text-asahi mt-0.5 sm:mt-1">{items.length}</p>
				</Card>
				<Card className="p-3 sm:p-6 text-center">
					<p className="text-xs sm:text-sm text-slate-500 truncate">In Stock</p>
					<p className="text-xl sm:text-3xl font-bold text-emerald-600 mt-0.5 sm:mt-1">{inStock}</p>
				</Card>
				<Card className="p-3 sm:p-6 text-center">
					<p className="text-xs sm:text-sm text-slate-500 truncate">Out</p>
					<p className="text-xl sm:text-3xl font-bold text-amber-600 mt-0.5 sm:mt-1">{out}</p>
				</Card>
			</div>

			<div>
				<div className="flex items-center justify-between gap-4 mb-2">
					<p className="text-sm font-medium text-slate-600">Activity</p>
					<select
						value={activityPeriod}
						onChange={(e) => handleActivityPeriodChange(e.target.value)}
						className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none text-slate-700 bg-white"
					>
						<option value="today">Today</option>
						<option value="week">This week</option>
						<option value="month">This month</option>
					</select>
				</div>
				<div className="grid grid-cols-2 gap-2 sm:gap-4">
					<Card className="p-3 sm:p-4">
						<p className="text-xs text-slate-500">Checked out</p>
						<p className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">
							{activity ? (activityPeriod === 'today' ? activity.outToday : activityPeriod === 'week' ? activity.outThisWeek : activity.outThisMonth) : '—'}
						</p>
					</Card>
					<Card className="p-3 sm:p-4">
						<p className="text-xs text-slate-500">Checked in</p>
						<p className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5">
							{activity ? (activityPeriod === 'today' ? activity.inToday : activityPeriod === 'week' ? activity.inThisWeek : activity.inThisMonth) : '—'}
						</p>
					</Card>
				</div>
			</div>

			<Card>
				<div className="p-4 border-b border-slate-200">
					<h3 className="font-semibold text-slate-800">Recent Activity</h3>
				</div>
				<div className="divide-y divide-slate-100">
					{recentLoading ? (
						<div className="p-8 text-center text-slate-500">Loading...</div>
					) : recentActivity.length === 0 ? (
						<div className="p-8 text-center text-slate-500">
							No activity yet. Checkouts and check-ins will appear here.
						</div>
					) : (
						recentActivity.map((t) => (
							<div
								key={t.id}
								className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors"
							>
								<div className="flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={`inline-flex px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
												t.type === 'out'
													? 'bg-amber-100 text-amber-800'
													: 'bg-emerald-100 text-emerald-800'
											}`}
										>
											{t.type === 'out' ? 'Checkout' : 'Check-in'}
										</span>
										{t.item?.id ? (
											<Link
												to={`/inventory/${t.item.id}`}
												className="font-medium text-slate-800 hover:text-asahi truncate"
											>
												{t.item.name || 'Unknown'}
											</Link>
										) : (
											<span className="text-slate-600">Unknown item</span>
										)}
										{(t.quantity ?? 1) > 1 && (
											<span className="text-slate-500 text-sm">×{t.quantity}</span>
										)}
									</div>
									<div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
										{t.performedByDisplay && <span>by {t.performedByDisplay}</span>}
										{t.purpose && <span>{t.purpose}</span>}
										{t.recipient_name && <span>→ {t.recipient_name}</span>}
										<span>{new Date(t.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
									</div>
								</div>
								{t.item?.id && (
									<Link
										to={`/inventory/${t.item.id}`}
										className="text-sm text-asahi font-medium shrink-0 hover:underline"
									>
										View
									</Link>
								)}
							</div>
						))
					)}
				</div>
				{recentTotal > PAGE_SIZE && (
					<div className="flex items-center justify-center gap-2 py-3 border-t border-slate-200">
						<Button
							variant="outline"
							className="p-2 min-w-0"
							onClick={() => setRecentPage((p) => p - 1)}
							disabled={!hasPrev}
						>
							<ChevronLeft className="w-4 h-4" strokeWidth={2} />
						</Button>
						<span className="text-sm text-slate-600 px-2">
							{recentPage} / {totalPages}
						</span>
						<Button
							variant="outline"
							className="p-2 min-w-0"
							onClick={() => setRecentPage((p) => p + 1)}
							disabled={!hasNext}
						>
							<ChevronRight className="w-4 h-4" strokeWidth={2} />
						</Button>
					</div>
				)}
			</Card>
		</div>
	);
}
