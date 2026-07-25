"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { AdminListingsTable } from "@/components/admin/AdminListingsTable";
import { AdminCard } from "@/components/admin/AdminCard";
import { adminAdapter } from "@/lib/adapters/adminAdapter";
import { PropertyListItem } from "@/lib/adapters/types";

const FILTERS = [
    { value: "all", label: "All" },
    { value: "in_review", label: "In review" },
    { value: "verification_pending", label: "Verification pending" },
    { value: "live", label: "Live" },
    { value: "awaiting_owner_login", label: "Awaiting owner" },
    { value: "rejected", label: "Rejected" },
];

export default function AdminListingsPage() {
    const [rows, setRows] = useState<PropertyListItem[]>([]);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const query = search.trim();
        const timer = window.setTimeout(() => {
            setLoading(true);
            adminAdapter
                .listListings({
                    verification_status: filter,
                    search: query || undefined,
                    page: 1,
                    page_size: 50,
                })
                .then((result) => setRows(result.listings))
                .catch(() => setRows([]))
                .finally(() => setLoading(false));
        }, query ? 300 : 0);

        return () => window.clearTimeout(timer);
    }, [filter, search]);

    return (
        <>
            <header className="pb-4">
                <p className="text-sm font-semibold text-[#A67AEB]">Review queue</p>
                <h1 className="mt-1 text-3xl font-bold text-white">Listings</h1>
            </header>

            <div className="mb-4 grid gap-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
                    <input
                        className="h-14 w-full rounded-xl border border-white/15 bg-[#0d0d14] pl-11 pr-4 text-base text-white outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                        placeholder="Search title, area, phone, or listing ID"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                    {FILTERS.map((item) => {
                        const active = filter === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setFilter(item.value)}
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    active
                                        ? "bg-[#A67AEB] text-[#111]"
                                        : "border border-white/15 bg-[#111116] text-white/70 hover:text-white"
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <AdminCard className="text-center text-sm text-white/55">Loading listings…</AdminCard>
            ) : (
                <AdminListingsTable rows={rows} />
            )}
        </>
    );
}
