import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getItemById } from "../services/itemService";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { NavIcon } from "../components/icons/NavIcons";

export function SharedItemView() {
	const { id } = useParams();
	const { user } = useAuth();
	const [item, setItem] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		getItemById(id)
			.then(setItem)
			.catch(() => setItem(null))
			.finally(() => setLoading(false));
	}, [id]);

	// Logged in: redirect to full item detail
	if (user && id) {
		return <Navigate to={`/inventory/${id}`} replace />;
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
				<div className="animate-pulse text-slate-400">Loading...</div>
			</div>
		);
	}

	if (!item) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
				<Card className="p-6 max-w-md text-center">
					<p className="text-slate-600">Item not found or link may have expired.</p>
					<Link
						to="/login"
						className="inline-block px-4 py-2 rounded-lg font-medium bg-asahi text-white hover:bg-asahi-700 transition-colors mt-4"
					>
						Log in
					</Link>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 p-4 sm:p-6">
			<div className="max-w-xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<Link
						to="/login"
						className="text-sm font-medium text-slate-600 hover:text-slate-800"
					>
						Log in to manage
					</Link>
				</div>

				<Card className="p-6">
					<div className="flex flex-col sm:flex-row gap-6">
						<div className="shrink-0">
							{item.photo_url ? (
								<img
									src={item.photo_url}
									alt={item.name}
									className="w-full sm:w-36 h-36 rounded-xl object-cover"
								/>
							) : (
								<div className="w-full sm:w-36 h-36 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
									<NavIcon name="package" className="w-16 h-16" />
								</div>
							)}
						</div>
						<div className="flex-1 min-w-0 space-y-4">
							<h1 className="text-xl font-bold text-slate-800">{item.name}</h1>
							{item.description && (
								<p className="text-slate-600 text-sm">{item.description}</p>
							)}
							<div className="overflow-x-auto rounded-lg border border-slate-200">
								<table className="w-full text-sm">
									<tbody className="divide-y divide-slate-100">
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium w-28">Status</td>
											<td className="py-3 px-4">
												<StatusBadge status={item.status} />
											</td>
										</tr>
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">Quantity</td>
											<td className="py-3 px-4 text-slate-800">{item.quantity ?? 0}</td>
										</tr>
										{item.category && (
											<tr>
												<td className="py-3 px-4 text-slate-500 font-medium">Category</td>
												<td className="py-3 px-4 text-slate-800">{item.category}</td>
											</tr>
										)}
										{item.model_name && (
											<tr>
												<td className="py-3 px-4 text-slate-500 font-medium">Model</td>
												<td className="py-3 px-4 text-slate-800">{item.model_name}</td>
											</tr>
										)}
										{item.store_location && (
											<tr>
												<td className="py-3 px-4 text-slate-500 font-medium">Location</td>
												<td className="py-3 px-4 text-slate-800">{item.store_location}</td>
											</tr>
										)}
										{item.vehicle_model && (
											<tr>
												<td className="py-3 px-4 text-slate-500 font-medium">Vehicle</td>
												<td className="py-3 px-4 text-slate-800">{item.vehicle_model}</td>
											</tr>
										)}
										{item.agl_number && (
											<tr>
												<td className="py-3 px-4 text-slate-500 font-medium">AGL number</td>
												<td className="py-3 px-4 text-slate-800">{item.agl_number}</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</Card>

				<div className="text-center">
					<p className="text-sm text-slate-500 mb-3">
						Log in to view full details, checkout, and transaction history.
					</p>
					<Link
						to="/login"
						className="inline-block px-4 py-2 rounded-lg font-medium bg-asahi text-white hover:bg-asahi-700 transition-colors"
					>
						Log in
					</Link>
				</div>
			</div>
		</div>
	);
}
