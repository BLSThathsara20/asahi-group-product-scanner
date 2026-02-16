import { Link } from "react-router-dom";
import { useItems } from "../hooks/useItems";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { NavIcon } from "../components/icons/NavIcons";

export function Dashboard() {
	const { items, loading } = useItems();

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
					<p className="text-xs sm:text-sm text-slate-500 truncate">Total Items</p>
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

			<Card>
				<div className="p-4 border-b border-slate-200">
					<h3 className="font-semibold text-slate-800">Recent Items</h3>
				</div>
				<div className="divide-y divide-slate-100">
					{items.slice(0, 6).map((item) => (
						<Link
							key={item.id}
							to={`/inventory/${item.id}`}
							className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
						>
							<div className="flex items-center gap-4">
								{item.photo_url ? (
									<img
										src={item.photo_url}
										alt={item.name}
										className="w-12 h-12 rounded-lg object-cover"
									/>
								) : (
									<div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
										<NavIcon name="package" className="w-6 h-6" />
									</div>
								)}
								<div>
									<p className="font-medium text-slate-800">{item.name}</p>
									<p className="text-sm text-slate-500">{item.qr_id}</p>
								</div>
							</div>
							<StatusBadge status={item.status} />
						</Link>
					))}
					{items.length === 0 && (
						<div className="p-8 text-center text-slate-500">
							No items yet.{" "}
							<Link to="/inventory/add" className="text-asahi font-medium">
								Add your first item
							</Link>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
