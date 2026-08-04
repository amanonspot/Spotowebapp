"use client";

import Link from "next/link";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminListingSourceBadge } from "@/components/admin/AdminListingSourceBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import BlurImage from "@/components/revamp/BlurImage";
import { PropertyListItem } from "@/lib/adapters/types";
import { getListingSource } from "@/lib/utils/listingSource";

const formatCurrency = (value: number) => (value > 0 ? `₹${value.toLocaleString("en-IN")}` : "—");

export function AdminListingsTable({ rows }: { rows: PropertyListItem[] }) {
    if (rows.length === 0) {
        return <AdminCard className="text-center text-sm text-white/55">No listings found.</AdminCard>;
    }

    return (
        <>
            <AdminCard className="hidden max-w-full overflow-hidden p-0 lg:block">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/10 bg-[#0d0d14] text-white/55">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Listing</th>
                                <th className="px-4 py-3 font-semibold">Location</th>
                                <th className="px-4 py-3 font-semibold">Listed via</th>
                                <th className="px-4 py-3 font-semibold">Rent</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="border-b border-white/5 last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[#0d0d14]">
                                                {row.image ? (
                                                    <BlurImage src={row.image} alt={row.title} />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-white">{row.title}</p>
                                                <p className="font-mono text-xs text-white/45">{row.id.slice(0, 8)}…</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-white/70">
                                        <span className="line-clamp-2 break-words">
                                            {[row.locality, row.city].filter(Boolean).join(", ") || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <AdminListingSourceBadge source={getListingSource(row)} />
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-[#b7f041]">{formatCurrency(row.pricePerMonth)}</td>
                                    <td className="px-4 py-3">
                                        <AdminStatusBadge status={row.verificationStatus || row.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/listings/${row.id}`}
                                            className="text-sm font-semibold text-[#b7f041] hover:underline"
                                        >
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </AdminCard>

            <div className="grid w-full min-w-0 gap-3 lg:hidden">
                {rows.map((row) => {
                    const location = [row.locality, row.city].filter(Boolean).join(", ") || "—";
                    return (
                        <AdminCard key={row.id} className="w-full min-w-0 overflow-hidden p-3 sm:p-4">
                            <div className="flex min-w-0 gap-3">
                                <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-[#0d0d14] sm:h-20 sm:w-20">
                                    {row.image ? <BlurImage src={row.image} alt={row.title} /> : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-base">
                                        {row.title}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs text-white/55 sm:text-sm">{location}</p>
                                    <div className="mt-2">
                                        <AdminStatusBadge status={row.verificationStatus || row.status} compact />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                <AdminListingSourceBadge source={getListingSource(row)} className="min-w-0" />
                                <p className="text-xl font-bold tabular-nums text-[#b7f041] sm:text-right">
                                    {formatCurrency(row.pricePerMonth)}
                                </p>
                            </div>

                            <Link
                                href={`/admin/listings/${row.id}`}
                                className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-[#A67AEB]/35 bg-[#A67AEB]/10 px-4 text-sm font-semibold text-[#D4B0FF]"
                            >
                                Review listing
                            </Link>
                        </AdminCard>
                    );
                })}
            </div>
        </>
    );
}
