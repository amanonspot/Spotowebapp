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
            <AdminCard className="hidden overflow-hidden p-0 lg:block">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
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
                                        {[row.locality, row.city].filter(Boolean).join(", ") || "—"}
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

            <div className="grid gap-3 lg:hidden">
                {rows.map((row) => (
                    <AdminCard key={row.id} className="p-4">
                        <div className="flex gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#0d0d14]">
                                {row.image ? <BlurImage src={row.image} alt={row.title} /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="truncate font-semibold text-white">{row.title}</p>
                                    <AdminStatusBadge status={row.verificationStatus || row.status} />
                                </div>
                                <p className="mt-1 text-sm text-white/55">
                                    {[row.locality, row.city].filter(Boolean).join(", ") || "—"}
                                </p>
                                <div className="mt-2">
                                    <AdminListingSourceBadge source={getListingSource(row)} />
                                </div>
                                <p className="mt-2 text-lg font-bold text-[#b7f041]">{formatCurrency(row.pricePerMonth)}</p>
                                <Link
                                    href={`/admin/listings/${row.id}`}
                                    className="mt-3 inline-flex text-sm font-semibold text-[#A67AEB]"
                                >
                                    Review listing →
                                </Link>
                            </div>
                        </div>
                    </AdminCard>
                ))}
            </div>
        </>
    );
}
