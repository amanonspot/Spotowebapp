"use client";

import { AdminDailyCountDto } from "@/lib/rentals/wireTypes";

export function AdminMiniTrendChart({
    title,
    points,
    periodDays,
    accent = "purple",
}: {
    title: string;
    points: AdminDailyCountDto[];
    periodDays?: number;
    accent?: "purple" | "green";
}) {
    const max = Math.max(1, ...points.map((p) => p.count));

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0d0d14] p-4">
            <p className="text-sm font-semibold text-white/75">{title}</p>
            {points.length === 0 ? (
                <p className="mt-4 text-sm text-white/45">No login activity in this period.</p>
            ) : (
                <div className="mt-4 flex h-24 items-end gap-1">
                    {points.map((point) => (
                        <div key={point.day} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
                            <span className="text-[10px] font-semibold text-white/50">{point.count}</span>
                            <div
                                title={`${point.day}: ${point.count}`}
                                className={`w-full min-h-[8px] rounded-t transition-all ${
                                    accent === "green" ? "bg-[#b7f041]/70 group-hover:bg-[#b7f041]" : "bg-[#A67AEB]/60 group-hover:bg-[#A67AEB]"
                                }`}
                                style={{ height: `${Math.max(12, (point.count / max) * 100)}%` }}
                            />
                            <span className="truncate text-[9px] text-white/35">{point.day.slice(5)}</span>
                        </div>
                    ))}
                </div>
            )}
            <p className="mt-2 text-[10px] text-white/40">
                {periodDays ? `Last ${periodDays} day${periodDays === 1 ? "" : "s"}` : "Selected period"}
            </p>
        </div>
    );
}
