import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; className: string }> = {
    in_review: { label: "In review", className: "bg-amber-400/15 text-amber-300 ring-amber-400/30" },
    verification_pending: { label: "Verification pending", className: "bg-amber-400/15 text-amber-300 ring-amber-400/30" },
    verifying: { label: "Verifying", className: "bg-[#A67AEB]/15 text-[#D9C4FF] ring-[#A67AEB]/30" },
    live: { label: "Live", className: "bg-[#b7f041]/15 text-[#b7f041] ring-[#b7f041]/30" },
    rejected: { label: "Rejected", className: "bg-red-500/15 text-red-300 ring-red-400/30" },
    awaiting_owner_login: { label: "Awaiting owner", className: "bg-white/10 text-white/70 ring-white/20" },
    verification_retry: { label: "Retry needed", className: "bg-orange-400/15 text-orange-300 ring-orange-400/30" },
};

export function AdminStatusBadge({ status }: { status?: string }) {
    const key = (status || "in_review").toLowerCase();
    const meta = STATUS_META[key] || { label: status || "Unknown", className: "bg-white/10 text-white/70 ring-white/20" };
    return (
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", meta.className)}>
            {meta.label}
        </span>
    );
}
