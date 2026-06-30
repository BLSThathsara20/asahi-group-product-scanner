import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getItemById } from "../services/itemService";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ProductImage } from "../components/ui/ProductImage";
import { NavIcon } from "../components/icons/NavIcons";
import { PageSkeleton, EmptyState } from "../components/ui/PageLayout";

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

	if (user && id) {
		return <Navigate to={`/inventory/${id}`} replace />;
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
				<div className="w-full max-w-lg">
					<PageSkeleton variant="detail" />
				</div>
			</div>
		);
	}

	if (!item) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
				<Card className="p-6 max-w-md w-full">
					<EmptyState
						icon="package"
						title="Item not found"
						description="This link may have expired"
						action={<Link to="/login"><Button>Sign in</Button></Link>}
					/>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 p-4 sm:p-6">
			<div className="max-w-xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Shared item</p>
					<Link to="/login" className="text-sm font-medium text-slate-600 hover:text-asahi transition-colors">
						Sign in to manage
					</Link>
				</div>

				<Card className="p-5 sm:p-6">
					<div className="flex flex-col sm:flex-row gap-6">
						<div className="shrink-0">
							{item.photo_url ? (
								<ProductImage
									src={item.photo_url}
									alt={item.name}
									className="w-full sm:w-36 h-36 rounded-xl"
									iconClassName="w-16 h-16"
								/>
							) : (
								<div className="w-full sm:w-36 h-36 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
									<NavIcon name="package" className="w-16 h-16" />
								</div>
							)}
						</div>
						<div className="flex-1 min-w-0 space-y-4">
							<div>
								<h1 className="text-xl font-semibold text-slate-800 tracking-tight">{item.name}</h1>
								<div className="mt-2">
									<StatusBadge status={item.status} />
								</div>
							</div>
							{item.description && (
								<p className="text-slate-600 text-sm">{item.description}</p>
							)}
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between gap-4 py-2 border-b border-slate-100">
									<dt className="text-slate-500">Quantity</dt>
									<dd className="text-slate-800 font-medium">{item.quantity ?? 0}</dd>
								</div>
								{item.category && (
									<div className="flex justify-between gap-4 py-2 border-b border-slate-100">
										<dt className="text-slate-500">Category</dt>
										<dd className="text-slate-800">{item.category}</dd>
									</div>
								)}
								{item.store_location && (
									<div className="flex justify-between gap-4 py-2 border-b border-slate-100">
										<dt className="text-slate-500">Location</dt>
										<dd className="text-slate-800">{item.store_location}</dd>
									</div>
								)}
								{item.vehicle_model && (
									<div className="flex justify-between gap-4 py-2 border-b border-slate-100">
										<dt className="text-slate-500">Vehicle</dt>
										<dd className="text-slate-800">{item.vehicle_model}</dd>
									</div>
								)}
								{item.agl_number && (
									<div className="flex justify-between gap-4 py-2">
										<dt className="text-slate-500">AGL number</dt>
										<dd className="text-slate-800">{item.agl_number}</dd>
									</div>
								)}
							</dl>
						</div>
					</div>
				</Card>

				<div className="text-center pb-6">
					<p className="text-sm text-slate-500 mb-3">
						Sign in for full details, checkout, and history.
					</p>
					<Link to="/login">
						<Button>Sign in</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
