import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function AdminCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl border border-white/15 bg-[#111116] p-5 shadow-lg shadow-black/20",
                className
            )}
            {...props}
        />
    );
}
