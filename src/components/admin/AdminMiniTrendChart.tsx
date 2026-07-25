"use client";

import { AdminDailyCountDto } from "@/lib/rentals/wireTypes";

export function AdminMiniTrendChart({
    title,
    points,
    accent = "purple",
}: {
    title: string;
    points: AdminDailyCountDto[];
    accent?: "purple" | "green";
}) {
    const max = Math.max(1, ...points.map((p) => p.count));

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0d0d14] p-4">
            <p className="text-sm font-semibold text-white/75">{title}</p>
            {points.length === 0 ? (
                <p className="mt-4 text-sm text-white/45">No data yet — logins are tracked from deploy onward.</p>
            ) : (
                <div className="mt-4 flex h-24 items-end gap-1">
                    {points.map((point) => (
                        <div key={point.day} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
                            <div
                                title={`${point.day}: ${point.count}`}
                                className={`w-full rounded-t transition-all ${
                                    accent === "green" ? "bg-[#b7f041]/70 group-hover:bg-[#b7f041]" : "bg-[#A67AEB]/60 group-hover:bg-[#A67AEB]"
                                }`}
                                style={{ height: `${Math.max(8, (point.count / max) * 100)}%` }}
                            />
                        </div>
                    ))}
                </div>
            )}
            <p className="mt-2 text-[10px] text-white/40">Last 30 days</p>
        </div>
    );
}
