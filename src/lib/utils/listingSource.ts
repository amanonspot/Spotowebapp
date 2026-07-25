import { PropertyListItem } from "@/lib/adapters/types";

export type ListingChannel = "agent" | "owner";

export interface ListingSourceInfo {
    channel: ListingChannel;
    label: string;
    detail?: string;
}

export function getListingSource(item: Pick<
    PropertyListItem,
    "listedByEmployeeId" | "listedByEmployeeName" | "ownerListingName" | "contactPhone"
>): ListingSourceInfo {
    if (item.listedByEmployeeId || item.listedByEmployeeName) {
        const detail = [item.listedByEmployeeName, item.listedByEmployeeId].filter(Boolean).join(" · ");
        return { channel: "agent", label: "Agent", detail: detail || undefined };
    }

    const detail = [item.ownerListingName, item.contactPhone].filter(Boolean).join(" · ");
    return { channel: "owner", label: "Owner", detail: detail || undefined };
}
