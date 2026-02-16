import {
	LayoutDashboard,
	Package,
	Plus,
	Camera,
	FileText,
	Heart,
	Users,
	MoreHorizontal,
	FolderOpen,
	X,
	MapPin,
	Car,
	AlertTriangle,
	Check,
	Info,
	Pencil,
	Trash2,
} from "lucide-react";

export const NavIcons = {
	dashboard: LayoutDashboard,
	inventory: Package,
	add: Plus,
	scan: Camera,
	reports: FileText,
	health: Heart,
	users: Users,
	more: MoreHorizontal,
	folder: FolderOpen,
	camera: Camera,
	close: X,
	package: Package,
	mapPin: MapPin,
	car: Car,
	warning: AlertTriangle,
	check: Check,
	info: Info,
	pencil: Pencil,
	trash: Trash2,
};

export function NavIcon({ name, className = "w-5 h-5" }) {
	const Icon = NavIcons[name];
	if (!Icon) return null;
	return <Icon className={className} strokeWidth={1.5} />;
}
