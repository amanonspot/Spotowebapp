import type { LucideIcon } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminCard";
import { cn } from "@/lib/utils";

export function AdminStatCard({
    label,
    value,
    icon: Icon,
    accent = "purple",
}: {
    label: string;
    value: string | number;
    icon: LucideIcon;
    accent?: "purple" | "green" | "amber";
}) {
    const tone =
        accent === "green"
            ? "bg-[#b7f041]/15 text-[#b7f041]"
            : accent === "amber"
              ? "bg-amber-400/15 text-amber-300"
              : "bg-[#A67AEB]/15 text-[#A67AEB]";

    return (
        <AdminCard className="flex items-center gap-4 p-4">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tone)}>
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
                <p className="truncate text-sm text-white/55">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </AdminCard>
    );
}
