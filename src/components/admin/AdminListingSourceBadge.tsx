import { ListingSourceInfo } from "@/lib/utils/listingSource";
import { cn } from "@/lib/utils";

export function AdminListingSourceBadge({
    source,
    className,
}: {
    source: ListingSourceInfo;
    className?: string;
}) {
    const isAgent = source.channel === "agent";

    return (
        <div className={cn("min-w-0", className)}>
            <span
                className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    isAgent ? "bg-[#A67AEB]/20 text-[#D4B0FF]" : "bg-[#b7f041]/15 text-[#b7f041]"
                )}
            >
                {source.label}
            </span>
            {source.detail ? <p className="mt-1 truncate text-xs text-white/55">{source.detail}</p> : null}
        </div>
    );
}
