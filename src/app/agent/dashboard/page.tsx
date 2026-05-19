"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Home } from "lucide-react";
import BlurImage from "@/components/revamp/BlurImage";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";
import { agentAdapter } from "@/lib/adapters";
import { PropertyListItem } from "@/lib/adapters/types";

const formatDate = (value?: string) => {
    if (!value) return "Recently updated";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Recently updated";
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
};

const statusLabel = (item: PropertyListItem) => {
    const status = `${item.verificationStatus || item.status || ""}`.toLowerCase();
    if (status.includes("live")) return "Live";
    if (status.includes("awaiting_owner")) return "Awaiting owner login";
    if (status.includes("reject")) return "Rejected";
    return "In review";
};

export default function AgentDashboardPage() {
    const [listings, setListings] = useState<PropertyListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const items = await agentAdapter.listAgentProperties();
            setListings(items);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Unable to load your listings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <main className="min-h-screen bg-[#050507] text-white">
            <div className="mx-auto w-full max-w-[420px] px-4 pb-10 pt-6 sm:max-w-lg">
                <Link
                    href="/"
                    className="mb-5 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80"
                >
                    <Home className="h-4 w-4" />
                    Home
                </Link>
                <div className="mb-6 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Field agent</h1>
                        <p className="mt-1 text-sm text-white/60">List properties on behalf of owners.</p>
                    </div>
                    <Link
                        href="/agent/list-property"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#A67AEB]/50 bg-[#A67AEB]/15 text-white"
                        aria-label="Add listing"
                    >
                        <Plus className="h-5 w-5" />
                    </Link>
                </div>

                <Link
                    href="/agent/list-property"
                    className="btn-shimmer mb-6 flex w-full items-center justify-center rounded-xl bg-[#A67AEB] px-6 py-3 text-base font-semibold text-white"
                >
                    Add owner listing
                </Link>

                {loading ? (
                    <div className="space-y-4">
                        <ShimmerBlock className="h-40 w-full rounded-2xl" />
                        <ShimmerBlock className="h-40 w-full rounded-2xl" />
                    </div>
                ) : null}

                {error ? (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
                ) : null}

                {!loading && !error && listings.length === 0 ? (
                    <p className="rounded-2xl border border-white/15 bg-[#101018] p-4 text-sm text-white/70">
                        No listings yet. Tap &quot;Add owner listing&quot; to create one for a property owner.
                    </p>
                ) : null}

                {!loading && !error
                    ? listings.map((item) => (
                          <article
                              key={item.id}
                              className="mb-4 overflow-hidden rounded-2xl border border-white/15 bg-[#101018]"
                          >
                              <div className="relative h-44 w-full bg-[#1a1a24]">
                                  {item.image ? (
                                      <BlurImage
                                          src={item.image}
                                          alt={item.title}
                                          wrapperClassName="h-full w-full"
                                          className="h-full w-full object-cover"
                                      />
                                  ) : (
                                      <div className="flex h-full items-center justify-center text-sm text-white/40">
                                          No photo
                                      </div>
                                  )}
                                  <span className="absolute right-3 top-3 rounded-xl bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                                      {statusLabel(item)}
                                  </span>
                              </div>
                              <div className="p-4">
                                  <h2 className="text-lg font-semibold">{item.propertyTitle || item.title}</h2>
                                  <p className="mt-1 text-sm text-white/60">{item.locality || "Locality pending"}</p>
                                  <p className="mt-2 text-xs text-white/45">{formatDate(item.lastStatusAt)}</p>
                              </div>
                          </article>
                      ))
                    : null}
            </div>
        </main>
    );
}
