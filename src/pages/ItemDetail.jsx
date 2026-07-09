import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
	getItemById,
	getTransactions,
	getItemBarcodes,
	updateItem,
	syncItemBarcodes,
	createTransaction,
	logItemAction,
	deleteItem,
} from "../services/itemService";
import { getProfilesByIds } from "../services/userService";
import { useNotification } from "../context/NotificationContext";
import {
	buildItemEditSummary,
	ACTION_TYPE_LABELS,
	ACTION_TYPE_STYLES,
	formatActionSummary,
} from "../lib/itemActions";
import { displayPerformer } from "../lib/performer";
import { MAX_ITEM_ACTIONS } from "../lib/itemActionLimits";
import { Card } from "../components/ui/Card";
import { Pagination } from "../components/ui/Pagination";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ProductImage } from "../components/ui/ProductImage";
import {
	PageContainer,
	PageHeader,
	PageSkeleton,
	EmptyState,
} from "../components/ui/PageLayout";
import { ItemLabelExport } from "../components/Labels/ItemLabelExport";
import { NavIcon } from "../components/icons/NavIcons";
import {
	CheckOutForm,
	CheckInForm,
	EditItemForm,
} from "../components/Inventory";

export function ItemDetail() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { user, profile, isAdmin } = useAuth();
	const { success: notifySuccess, error: notifyError } = useNotification();
	const [item, setItem] = useState(null);
	const [itemBarcodes, setItemBarcodes] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [performerNames, setPerformerNames] = useState({});
	const [loading, setLoading] = useState(true);
	const [showCheckOut, setShowCheckOut] = useState(false);
	const [showCheckIn, setShowCheckIn] = useState(false);
	const [showEdit, setShowEdit] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [barcodeAccordionOpen, setBarcodeAccordionOpen] = useState(false);
	const [showImagePreview, setShowImagePreview] = useState(false);
	const [actionPage, setActionPage] = useState(1);
	const [actionPageSize, setActionPageSize] = useState(10);
	const hasRetried = useRef(false);

	const paginatedTransactions = useMemo(() => {
		const start = (actionPage - 1) * actionPageSize;
		return transactions.slice(start, start + actionPageSize);
	}, [transactions, actionPage, actionPageSize]);

	useEffect(() => {
		setActionPage(1);
	}, [id, transactions.length]);

	const handleDelete = async () => {
		if (!isAdmin || !item?.id) return;
		if (
			!confirm(
				"Permanently delete this spare part? All actions, barcodes, photos, and history will be removed. A summary is kept in the deletion log.",
			)
		)
			return;
		setDeleting(true);
		try {
			await deleteItem(item.id, user?.id);
			notifySuccess("Item deleted");
			navigate("/inventory");
		} catch (err) {
			console.error(err);
			notifyError(err?.message || "Failed to delete item");
		} finally {
			setDeleting(false);
		}
	};

	const load = async () => {
		setLoading(true);
		try {
			const [itemData, txData, barcodes] = await Promise.all([
				getItemById(id),
				getTransactions(id),
				getItemBarcodes(id),
			]);
			setItem(itemData);
			setItemBarcodes(barcodes || []);
			setTransactions(txData);
			if (itemData) {
				const ids = [
					...new Set([
						itemData.added_by,
						itemData.last_used_by,
						...txData.map((t) => t.performed_by),
					]),
				].filter((id) => id != null);
				if (ids.length > 0) {
					const names = await getProfilesByIds(ids);
					setPerformerNames(names);
				}
			}
		} catch (err) {
			console.error(err);
			setItem(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!id) return;
		hasRetried.current = false;
		load();
	}, [id]);

	// Retry once after 2s if item not found (handles read-after-write delay after add)
	useEffect(() => {
		if (!id || loading || item || hasRetried.current) return;
		const timer = setTimeout(() => {
			hasRetried.current = true;
			load();
		}, 2000);
		return () => clearTimeout(timer);
	}, [id, loading, item]);

	useEffect(() => {
		if (!item || !id) return;
		const checkout = searchParams.get("checkout") === "1";
		const checkin = searchParams.get("checkin") === "1";
		if (checkout && item.status === "in_stock") {
			setShowCheckOut(true);
			navigate(`/inventory/${id}`, { replace: true });
		} else if (checkin && item.status === "out") {
			setShowCheckIn(true);
			navigate(`/inventory/${id}`, { replace: true });
		}
	}, [item, searchParams, id, navigate]);

	const handleCheckOut = async (data) => {
		const qty = data.quantity ?? 1;
		const newQty = Math.max(0, (item?.quantity ?? 0) - qty);
		const recordedAt = new Date().toISOString();
		try {
			await createTransaction({
				item_id: id,
				type: "out",
				quantity: qty,
				recipient_name: data.recipientName,
				purpose: data.purpose,
				responsible_person: data.responsiblePerson,
				vehicle_model: data.vehicleModel || null,
				notes: data.notes,
				performed_by: user?.id,
				created_at: recordedAt,
			});
			await updateItem(id, {
				quantity: newQty,
				status: newQty === 0 ? "out" : "in_stock",
				last_used_date: recordedAt,
				last_used_by: user?.id,
			});
			notifySuccess("Item checked out");
			setShowCheckOut(false);
			if (searchParams.get("checkout") === "1") {
				navigate(`/inventory/${id}`, { replace: true });
			}
			load();
		} catch (err) {
			notifyError(err.message || "Check out failed");
			throw err;
		}
	};

	const handleSaveEdit = async (updates) => {
		try {
			const { barcodes, ...itemUpdates } = updates;
			const summary = buildItemEditSummary(
				item,
				{ ...itemUpdates, barcodes },
				{ beforeBarcodes: itemBarcodes },
			);
			await updateItem(id, itemUpdates);
			if (Array.isArray(barcodes)) {
				await syncItemBarcodes(id, barcodes);
			}
			await logItemAction(id, { type: "updated", notes: summary }, user?.id);
			notifySuccess("Item updated");
			setShowEdit(false);
			load();
		} catch (err) {
			notifyError(err.message || "Update failed");
			throw err;
		}
	};

	const handleCheckIn = async (data) => {
		const qty = data.quantity ?? 1;
		const newQty = (item?.quantity ?? 0) + qty;
		const recordedAt = new Date().toISOString();
		try {
			await createTransaction({
				item_id: id,
				type: "in",
				quantity: qty,
				notes: data.notes || "Item returned to spare parts",
				performed_by: user?.id,
				created_at: recordedAt,
			});
			await updateItem(id, {
				quantity: newQty,
				status: "in_stock",
				last_used_date: recordedAt,
				last_used_by: user?.id,
			});
			notifySuccess("Item checked in");
			setShowCheckIn(false);
			if (searchParams.get("checkin") === "1") {
				navigate(`/inventory/${id}`, { replace: true });
			}
			load();
		} catch (err) {
			notifyError(err.message || "Check in failed");
			throw err;
		}
	};

	if (loading) {
		return (
			<PageContainer width="wide">
				<PageSkeleton variant="detail" />
			</PageContainer>
		);
	}

	if (!item) {
		return (
			<PageContainer width="wide">
				<EmptyState
					icon="package"
					title="Item not found"
					description="This item may have been removed"
					action={
						<Button onClick={() => navigate("/inventory")}>
							Back to spare parts
						</Button>
					}
				/>
			</PageContainer>
		);
	}

	const actionButtons = (
		<div className="flex gap-2 flex-wrap justify-end">
			<Button
				variant="outline"
				onClick={async () => {
					const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
					const shareUrl = new URL(
						`${base ? base + "/" : ""}share/${id}`,
						window.location.origin,
					).href;
					await navigator.clipboard.writeText(shareUrl);
					notifySuccess("Link copied to clipboard");
				}}
				title="Share item"
				className="hidden sm:flex p-2"
				aria-label="Share item"
			>
				<NavIcon name="share" className="w-4 h-4" />
			</Button>
			{item.status === "in_stock" && (
				<>
					<Button
						variant="outline"
						onClick={() => setShowEdit(true)}
						title="Edit item"
						className="p-2"
					>
						<NavIcon name="pencil" className="w-4 h-4" />
					</Button>
					<Button onClick={() => setShowCheckOut(true)}>Check out</Button>
				</>
			)}
			{item.status === "out" && (
				<Button onClick={() => setShowCheckIn(true)} title="Check in">
					<NavIcon name="packagePlus" className="w-4 h-4" />
					Check in
				</Button>
			)}
			{isAdmin && (
				<Button
					variant="outline"
					onClick={handleDelete}
					disabled={deleting}
					title="Delete item"
					className="p-2 text-red-600 border-red-200 hover:bg-red-50"
				>
					<NavIcon name="trash" className="w-4 h-4" />
				</Button>
			)}
		</div>
	);

	return (
		<PageContainer width="wide">
			<PageHeader
				title={item.name}
				subtitle={item.qr_id}
				onBack={() => navigate(-1)}
				action={actionButtons}
			/>

			{/* Section 1: Item overview - ordered for clarity */}
			<Card className="p-6">
				<div className="flex flex-col sm:flex-row gap-6">
					{/* Photo - left on desktop, top on mobile */}
					<div className="shrink-0 relative">
						{item.photo_url ? (
							<>
								<ProductImage
									src={item.photo_url}
									alt={item.name}
									className="w-full sm:w-36 h-36 rounded-xl"
									iconClassName="w-16 h-16"
									priority
								/>
								<button
									type="button"
									onClick={() => setShowImagePreview(true)}
									className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
									title="View full size"
									aria-label="View full size"
								>
									<NavIcon name="eye" className="w-4 h-4" />
								</button>
							</>
						) : (
							<div className="w-full sm:w-36 h-36 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
								<NavIcon name="package" className="w-16 h-16" />
							</div>
						)}
					</div>
					{/* Details - right on desktop, below photo on mobile */}
					<div className="flex-1 min-w-0 space-y-4">
						<p className="text-slate-600 text-sm">
							{item.description || "No description"}
						</p>
						{/* Key details - table format */}
						<div className="overflow-x-auto rounded-lg border border-slate-200">
							<table className="w-full text-sm">
								<tbody className="divide-y divide-slate-100">
									<tr>
										<td className="py-3 px-4 text-slate-500 font-medium w-32">
											Status
										</td>
										<td className="py-3 px-4">
											<StatusBadge status={item.status} />
										</td>
									</tr>
									<tr>
										<td className="py-3 px-4 text-slate-500 font-medium">
											Quantity
										</td>
										<td className="py-3 px-4 text-slate-800">
											{item.quantity ?? 0}
										</td>
									</tr>
									{item.category && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												Category
											</td>
											<td className="py-3 px-4 text-slate-800">
												{item.category}
											</td>
										</tr>
									)}
									{item.store_location && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												<span className="inline-flex items-center gap-1">
													<NavIcon name="mapPin" className="w-3.5 h-3.5" />{" "}
													Location
												</span>
											</td>
											<td className="py-3 px-4 text-slate-800">
												{item.store_location}
											</td>
										</tr>
									)}
									{item.vehicle_models?.length > 0 && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												<span className="inline-flex items-center gap-1">
													<NavIcon name="car" className="w-3.5 h-3.5" /> Vehicle
													{item.vehicle_models.length > 1 ? "s" : ""}
												</span>
											</td>
											<td className="py-3 px-4 text-slate-800">
												<div className="flex flex-wrap gap-1.5">
													{item.vehicle_models.map((model) => (
														<span
															key={model}
															className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-sm"
														>
															{model}
														</span>
													))}
												</div>
											</td>
										</tr>
									)}
									{item.model_names?.length > 0 && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												Part model{item.model_names.length > 1 ? "s" : ""}
											</td>
											<td className="py-3 px-4 text-slate-800">
												<div className="flex flex-wrap gap-1.5">
													{item.model_names.map((model) => (
														<span
															key={model}
															className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-sm"
														>
															{model}
														</span>
													))}
												</div>
											</td>
										</tr>
									)}
									{item.sku_code && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												SKU
											</td>
											<td className="py-3 px-4 text-slate-800 font-mono">
												{item.sku_code}
											</td>
										</tr>
									)}
									{item.agl_number && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												AGL number
											</td>
											<td className="py-3 px-4 text-slate-800">
												{item.agl_number}
											</td>
										</tr>
									)}
									{item.unit_price != null && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												Unit price
											</td>
											<td className="py-3 px-4 text-slate-800">
												{formatGbp(item.unit_price)}
											</td>
										</tr>
									)}
									{item.added_date && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												Added
											</td>
											<td className="py-3 px-4 text-slate-800">
												{new Date(item.added_date).toLocaleString(undefined, {
													dateStyle: "medium",
													timeStyle: "short",
												})}
												{item.added_by && performerNames[item.added_by] && (
													<span className="text-slate-500">
														{" "}
														by {performerNames[item.added_by]}
													</span>
												)}
											</td>
										</tr>
									)}
									{item.last_used_date && (
										<tr>
											<td className="py-3 px-4 text-slate-500 font-medium">
												Last used
											</td>
											<td className="py-3 px-4 text-slate-800">
												{new Date(item.last_used_date).toLocaleDateString()}
												{item.last_used_by &&
													performerNames[item.last_used_by] && (
														<span className="text-slate-500">
															{" "}
															by {performerNames[item.last_used_by]}
														</span>
													)}
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</Card>

			{showImagePreview && item?.photo_url && (
				<div
					className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
					onClick={() => setShowImagePreview(false)}
				>
					<button
						type="button"
						onClick={() => setShowImagePreview(false)}
						className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
						aria-label="Close"
					>
						<NavIcon name="close" className="w-6 h-6" />
					</button>
					<div onClick={(e) => e.stopPropagation()}>
						<ProductImage
							src={item.photo_url}
							alt={item.name}
							className="min-w-[200px] min-h-[200px] max-w-[90vw] max-h-[85vh] flex items-center justify-center"
							imgClassName="max-w-full max-h-[85vh] w-auto h-auto object-contain"
							iconClassName="w-16 h-16"
						/>
					</div>
				</div>
			)}

			{showEdit && (
				<Modal onBackdropClick={() => setShowEdit(false)}>
					<Card className="p-6">
						<h3 className="font-semibold text-slate-800 mb-4">Edit Item</h3>
						<EditItemForm
							item={item}
							onSave={handleSaveEdit}
							onCancel={() => setShowEdit(false)}
						/>
					</Card>
				</Modal>
			)}

			{showCheckOut && (
				<CheckOutForm
					onSubmit={handleCheckOut}
					onCancel={() => {
						setShowCheckOut(false);
						if (searchParams.get("checkout") === "1") {
							navigate(`/inventory/${id}`, { replace: true });
						}
					}}
					item={item}
					currentUserId={user?.id}
					currentUserDisplay={profile?.full_name || user?.email}
				/>
			)}

			{showCheckIn && (
				<Modal onBackdropClick={() => setShowCheckIn(false)}>
					<CheckInForm
						item={item}
						onSubmit={handleCheckIn}
						onCancel={() => setShowCheckIn(false)}
					/>
				</Modal>
			)}

			<Card>
				<div className="p-4 border-b border-slate-200">
					<h3 className="font-semibold text-slate-800">Action history</h3>
					<p className="text-xs text-slate-500 mt-0.5">
						Latest {MAX_ITEM_ACTIONS} actions kept per part · older rows removed
						from database
					</p>
				</div>
				<div className="divide-y divide-slate-100">
					{paginatedTransactions.map((tx) => {
						const who = displayPerformer(tx, performerNames);
						return (
							<div
								key={tx.id}
								className="p-4 flex items-start justify-between gap-4"
							>
								<div>
									<span
										className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
											ACTION_TYPE_STYLES[tx.type] ||
											"bg-slate-100 text-slate-800"
										}`}
									>
										{ACTION_TYPE_LABELS[tx.type] || tx.type}
										{(tx.type === "in" || tx.type === "out") &&
										(tx.quantity ?? 1) > 0
											? ` ×${tx.quantity ?? 1}`
											: ""}
									</span>
									<p className="mt-1 text-slate-800 font-medium">
										{formatActionSummary(tx)}
									</p>
									{tx.responsible_person && (
										<p className="text-sm text-slate-500">
											Responsible: {tx.responsible_person}
										</p>
									)}
									{who && <p className="text-sm text-slate-500">By {who}</p>}
								</div>
								<span className="text-sm text-slate-500 whitespace-nowrap">
									{new Date(tx.created_at).toLocaleString()}
								</span>
							</div>
						);
					})}
					{transactions.length === 0 && (
						<div className="p-8 text-center text-slate-500">
							No actions recorded yet
						</div>
					)}
				</div>
				<Pagination
					page={actionPage}
					totalItems={transactions.length}
					pageSize={actionPageSize}
					onPageChange={setActionPage}
					onPageSizeChange={(size) => {
						setActionPageSize(size);
						setActionPage(1);
					}}
				/>
			</Card>

			{/* Barcode & QR Code - accordion at bottom (default closed) */}
			<Card className="overflow-hidden">
				<button
					type="button"
					onClick={() => setBarcodeAccordionOpen((o) => !o)}
					className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-slate-50 transition-colors"
				>
					<h3 className="font-semibold text-slate-800">Product label</h3>
					<NavIcon
						name={barcodeAccordionOpen ? "chevronDown" : "chevronRight"}
						className="w-5 h-5 text-slate-500"
					/>
				</button>
				{barcodeAccordionOpen && (
					<div className="border-t border-slate-200 p-6">
						<div className="space-y-6">
							{(itemBarcodes?.length > 0 || item?.qr_id) && (
								<div>
									<h4 className="font-medium text-slate-700 mb-2">Barcodes</h4>
									<ul className="space-y-1.5 text-sm">
										{item?.qr_id && (
											<li className="flex items-center gap-2">
												<span className="text-slate-500 w-16 shrink-0">
													Primary
												</span>
												<code className="px-2 py-1 bg-slate-100 rounded font-mono text-slate-800 truncate max-w-[200px]">
													{item.qr_id}
												</code>
											</li>
										)}
										{itemBarcodes?.map((b, i) => (
											<li key={i} className="flex items-center gap-2">
												<span className="text-slate-500 w-16 shrink-0">
													Extra {i + 1}
												</span>
												<code className="px-2 py-1 bg-slate-100 rounded font-mono text-slate-800 truncate max-w-[200px]">
													{b}
												</code>
											</li>
										))}
									</ul>
								</div>
							)}
							<ItemLabelExport item={item} />
						</div>
					</div>
				)}
			</Card>

			{/* Floating share button - mobile only, bottom right */}
			<button
				type="button"
				onClick={async () => {
					const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
					const shareUrl = new URL(
						`${base ? base + "/" : ""}share/${id}`,
						window.location.origin,
					).href;
					await navigator.clipboard.writeText(shareUrl);
					notifySuccess("Link copied to clipboard");
				}}
				title="Share item"
				aria-label="Share item"
				className="sm:hidden fixed bottom-20 right-4 z-50 p-2.5 rounded-full bg-asahi text-white shadow-lg hover:bg-asahi-700 transition-colors"
			>
				<NavIcon name="share" className="w-5 h-5" />
			</button>
		</PageContainer>
	);
}
