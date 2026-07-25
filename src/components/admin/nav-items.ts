import type { LucideIcon } from "lucide-react";
import { Activity, ClipboardList, LayoutDashboard, Users } from "lucide-react";

export const ADMIN_NAV_ITEMS: {
    href: string;
    label: string;
    icon: LucideIcon;
}[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/listings", label: "Listings", icon: ClipboardList },
    { href: "/admin/users", label: "Users", icon: Activity },
    { href: "/admin/agents", label: "Agents", icon: Users },
];

export function isAdminNavActive(pathname: string, href: string) {
    if (href === "/admin/dashboard") {
        return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
}
