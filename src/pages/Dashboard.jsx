import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useItems } from "../hooks/useItems";
import { useAuth } from "../context/AuthContext";
import { getDashboardActivityStats, getRecentActivity } from "../services/analyticsService";
import { ACTION_TYPE_LABELS } from "../lib/itemActions";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { NavIcon } from "../components/icons/NavIcons";
import {
	PageContainer,
	PageSkeleton,
	SegmentPills,
	StatBlock,
	EmptyState,
} from "../components/ui/PageLayout";

const PAGE_SIZE = 5;

const PERIOD_OPTIONS = [
	{ id: "today", label: "Today" },
	{ id: "week", label: "Week" },
	{ id: "month", label: "Month" },
];

const QUICK_ACTIONS = [
	{ to: "/inventory/add", icon: "add", label: "Add part" },
	{ to: "/scan", icon: "scan", label: "Scan" },
	{ to: "/inventory", icon: "inventory", label: "Spare parts" },
];

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}

function formatActivityTime(value) {
	return new Date(value).toLocaleString(undefined, {
		dateStyle: "short",
		timeStyle: "short",
	});
}

export function Dashboard() {
	const { items, loading } = useItems();
	const { profile } = useAuth();
	const [activity, setActivity] = useState(null);
	const [activityPeriod, setActivityPeriod] = useState(() => {
		try {
			const saved = localStorage.getItem("dashboard-activity-period");
			if (saved === "today" || saved === "week" || saved === "month") return saved;
		} catch {}
		return "week";
	});
	const [recentActivity, setRecentActivity] = useState([]);
	const [recentTotal, setRecentTotal] = useState(0);
	const [recentPage, setRecentPage] = useState(1);
	const [recentLoading, setRecentLoading] = useState(false);

	const stats = useMemo(() => {
		let inStock = 0;
		let out = 0;
		for (const item of items) {
			if (item.status === "in_stock") inStock += 1;
			else if (item.status === "out") out += 1;
		}
		return { total: items.length, inStock, out };
	}, [items]);

	const periodActivity = useMemo(() => {
		if (!activity) return { checkedOut: null, checkedIn: null };
		if (activityPeriod === "today") {
			return { checkedOut: activity.outToday, checkedIn: activity.inToday };
		}
		if (activityPeriod === "month") {
			return { checkedOut: activity.outThisMonth, checkedIn: activity.inThisMonth };
		}
		return { checkedOut: activity.outThisWeek, checkedIn: activity.inThisWeek };
	}, [activity, activityPeriod]);

	const handleActivityPeriodChange = (value) => {
		setActivityPeriod(value);
		try {
			localStorage.setItem("dashboard-activity-period", value);
		} catch {}
	};

	useEffect(() => {
		getDashboardActivityStats()
			.then(setActivity)
			.catch(() => setActivity(null));
	}, []);

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
	const firstName = profile?.full_name?.trim().split(/\s+/)[0];

	if (loading) {
		return <PageSkeleton />;
	}

	return (
		<PageContainer>
			<header>
				<h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
					{getGreeting()}
					{firstName ? `, ${firstName}` : ""}
				</h1>
				<p className="text-sm text-slate-500 mt-1">
					{new Date().toLocaleDateString(undefined, {
						weekday: "long",
						month: "long",
						day: "numeric",
					})}
				</p>
			</header>

			<section className="grid grid-cols-3 gap-2 sm:gap-3">
				{QUICK_ACTIONS.map(({ to, icon, label }) => (
					<Link
						key={to}
						to={to}
						className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-white border border-slate-200/80 hover:border-asahi/25 hover:bg-asahi/[0.03] transition-colors"
					>
						<span className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 group-hover:bg-asahi/10 group-hover:text-asahi flex items-center justify-center transition-colors">
							<NavIcon name={icon} className="w-5 h-5" />
						</span>
						<span className="text-xs sm:text-sm font-medium text-slate-700 text-center">
							{label}
						</span>
					</Link>
				))}
			</section>

			<Card className="p-5 sm:p-6">
				<p className="text-sm font-medium text-slate-600 mb-4">Spare parts overview</p>
				<div className="grid grid-cols-3 gap-4 sm:gap-6">
					<StatBlock label="Total" value={stats.total} />
					<StatBlock label="In stock" value={stats.inStock} tone="success" />
					<StatBlock label="Out" value={stats.out} tone="warn" />
				</div>
			</Card>

			<Card className="p-5 sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<p className="text-sm font-medium text-slate-600">Check-ins & checkouts</p>
					<SegmentPills
						options={PERIOD_OPTIONS}
						value={activityPeriod}
						onChange={handleActivityPeriodChange}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div className="rounded-lg bg-amber-50/80 px-4 py-3">
						<p className="text-xs text-amber-700/80">Checked out</p>
						<p className="text-xl sm:text-2xl font-semibold text-amber-700 tabular-nums mt-0.5">
							{periodActivity.checkedOut ?? "—"}
						</p>
					</div>
					<div className="rounded-lg bg-emerald-50/80 px-4 py-3">
						<p className="text-xs text-emerald-700/80">Checked in</p>
						<p className="text-xl sm:text-2xl font-semibold text-emerald-700 tabular-nums mt-0.5">
							{periodActivity.checkedIn ?? "—"}
						</p>
					</div>
				</div>
			</Card>

			<Card className="overflow-hidden">
				<div className="px-5 py-4 sm:px-6 border-b border-slate-100">
					<h2 className="text-sm font-medium text-slate-600">Recent activity</h2>
				</div>

				{recentLoading ? (
					<div className="px-5 py-10 sm:px-6 space-y-4 animate-pulse">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex gap-3">
								<div className="w-2 h-2 rounded-full bg-slate-200 mt-2 shrink-0" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-3/4 bg-slate-200 rounded" />
									<div className="h-3 w-1/2 bg-slate-100 rounded" />
								</div>
							</div>
						))}
					</div>
				) : recentActivity.length === 0 ? (
					<EmptyState
						icon="inventory"
						title="No activity yet"
						description="Checkouts and check-ins will show up here"
					/>
				) : (
					<ul className="divide-y divide-slate-100">
						{recentActivity.map((t) => {
							const isOut = t.type === "out";
							const isIn = t.type === "in";
							const actionLabel =
								ACTION_TYPE_LABELS[t.type] ||
								(t.type ? t.type.replace(/_/g, " ") : "Activity");
							const meta = [
								t.performedByDisplay && `by ${t.performedByDisplay}`,
								t.purpose,
								t.recipient_name && `→ ${t.recipient_name}`,
								formatActivityTime(t.created_at),
							]
								.filter(Boolean)
								.join(" · ");

							return (
								<li key={t.id}>
									<div className="flex gap-3 px-5 py-3.5 sm:px-6 hover:bg-slate-50/80 transition-colors">
										<span
											className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
												isOut ? "bg-amber-400" : "bg-emerald-400"
											}`}
											aria-hidden
										/>
										<div className="flex-1 min-w-0">
											<p className="text-sm text-slate-800 leading-snug">
												{t.item?.id ? (
													<Link
														to={`/inventory/${t.item.id}`}
														className="font-medium hover:text-asahi transition-colors"
													>
														{t.item.name || "Unknown item"}
													</Link>
												) : (
													<span className="font-medium">Unknown item</span>
												)}
												<span className="text-slate-500">
													{" "}
													· {actionLabel}
													{(isIn || isOut) && (t.quantity ?? 1) > 1
														? ` ×${t.quantity}`
														: ""}
												</span>
											</p>
											{meta && (
												<p className="text-xs text-slate-500 mt-0.5 truncate">{meta}</p>
											)}
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}

				{recentTotal > PAGE_SIZE && (
					<div className="flex items-center justify-center gap-2 py-3 border-t border-slate-100 bg-slate-50/50">
						<Button
							variant="outline"
							className="p-2 min-w-0 border-slate-200"
							onClick={() => setRecentPage((p) => p - 1)}
							disabled={!hasPrev}
						>
							<ChevronLeft className="w-4 h-4" strokeWidth={2} />
						</Button>
						<span className="text-xs text-slate-500 tabular-nums">
							{recentPage} / {totalPages}
						</span>
						<Button
							variant="outline"
							className="p-2 min-w-0 border-slate-200"
							onClick={() => setRecentPage((p) => p + 1)}
							disabled={!hasNext}
						>
							<ChevronRight className="w-4 h-4" strokeWidth={2} />
						</Button>
					</div>
				)}
			</Card>
		</PageContainer>
	);
}
