"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Trash2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";
import { AdminListingSourceBadge } from "@/components/admin/AdminListingSourceBadge";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import BlurImage from "@/components/revamp/BlurImage";
import PropertyMediaLightbox from "@/components/revamp/PropertyMediaLightbox";
import { adminAdapter } from "@/lib/adapters/adminAdapter";
import { PropertyDetail } from "@/lib/adapters/types";
import { getListingSource } from "@/lib/utils/listingSource";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AdminListingDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [listing, setListing] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const load = async () => {
        setLoading(true);
        try {
            const detail = await adminAdapter.getListingDetail(id);
            setListing(detail);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to load listing.");
            setListing(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const refresh = async () => {
        await load();
    };

    const handleApprove = async () => {
        setWorking(true);
        try {
            await adminAdapter.approveListing(id);
            toast.success("Listing approved and is now live.");
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Approve failed.");
        } finally {
            setWorking(false);
        }
    };

    const handleReject = async () => {
        setWorking(true);
        try {
            await adminAdapter.rejectListing(id, rejectReason.trim() || undefined);
            toast.success("Listing rejected.");
            setRejectOpen(false);
            setRejectReason("");
            await refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Reject failed.");
        } finally {
            setWorking(false);
        }
    };

    const handleDelete = async () => {
        setWorking(true);
        try {
            await adminAdapter.deleteListing(id);
            toast.success("Listing deleted.");
            window.location.href = "/admin/listings";
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed.");
            setWorking(false);
        }
    };

    if (loading) {
        return <AdminCard className="text-sm text-white/55">Loading listing…</AdminCard>;
    }

    if (!listing) {
        return (
            <AdminCard>
                <p className="text-white">Listing not found.</p>
                <Link href="/admin/listings" className="mt-3 inline-block text-sm font-semibold text-[#b7f041]">
                    ← Back to listings
                </Link>
            </AdminCard>
        );
    }

    const status = `${listing.verificationStatus || listing.status || ""}`.toLowerCase();
    const canApprove = !status.includes("live") && !status.includes("reject");
    const canReject = !status.includes("reject");
    const gallery = listing.galleryMedia?.length
        ? listing.galleryMedia
        : (listing.galleryImages || []).map((url) => ({ url, mediaType: "image" as const }));

    return (
        <>
            <Link href="/admin/listings" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to listings
            </Link>

            <header className="pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#A67AEB]">Listing review</p>
                        <h1 className="mt-1 text-3xl font-bold text-white">{listing.title}</h1>
                        <p className="mt-1 font-mono text-xs text-white/45">{listing.id}</p>
                    </div>
                    <AdminStatusBadge status={listing.verificationStatus || listing.status} />
                </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    {gallery.length > 0 ? (
                        <AdminCard className="p-4">
                            <p className="mb-3 text-sm font-semibold text-white/75">Photos & videos</p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {gallery.map((item, index) => (
                                    <button
                                        key={`${item.url}-${index}`}
                                        type="button"
                                        onClick={() => {
                                            setLightboxIndex(index);
                                            setLightboxOpen(true);
                                        }}
                                        className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#0d0d14] ring-0 transition hover:ring-2 hover:ring-[#B7F041]/50"
                                    >
                                        {item.mediaType === "video" ? (
                                            <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                                        ) : (
                                            <BlurImage src={item.url} alt="" />
                                        )}
                                        <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent p-2 text-[10px] font-semibold text-white/80 opacity-0 transition group-hover:opacity-100">
                                            Preview
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </AdminCard>
                    ) : null}

                    <AdminCard>
                        <p className="text-sm font-semibold text-white/75">Property details</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <DetailRow label="Rent" value={listing.pricePerMonth ? `₹${listing.pricePerMonth.toLocaleString("en-IN")}/mo` : "—"} />
                            <DetailRow label="Deposit" value={listing.deposit ? `₹${listing.deposit.toLocaleString("en-IN")}` : "—"} />
                            <DetailRow label="BHK" value={listing.bhkLabel || String(listing.bhk || "—")} />
                            <DetailRow label="Furnishing" value={listing.furnishingLabel || "—"} />
                            <DetailRow label="Type" value={listing.propertyTypeLabel || "—"} />
                            <DetailRow label="Area" value={listing.builtUpAreaSqft ? `${listing.builtUpAreaSqft} sqft` : "—"} />
                            <DetailRow label="Locality" value={[listing.locality, listing.city].filter(Boolean).join(", ") || "—"} />
                            <DetailRow label="Address" value={listing.addressLine || "—"} />
                        </div>
                        {listing.description ? (
                            <p className="mt-4 text-sm leading-relaxed text-white/70">{listing.description}</p>
                        ) : null}
                    </AdminCard>
                </div>

                <div className="space-y-4">
                    <AdminCard>
                        <p className="text-sm font-semibold text-white/75">Listed via</p>
                        <div className="mt-3">
                            <AdminListingSourceBadge source={getListingSource(listing)} />
                        </div>
                        {listing.listedByEmployeeId ? (
                            <p className="mt-2 text-xs text-white/45">Employee ID: {listing.listedByEmployeeId}</p>
                        ) : null}
                    </AdminCard>

                    <AdminCard>
                        <p className="text-sm font-semibold text-white/75">Owner contact</p>
                        <div className="mt-3 space-y-2 text-sm">
                            <DetailRow label="Name" value={listing.owner?.ownerName || "—"} />
                            <DetailRow
                                label="Phone"
                                value={
                                    listing.owner?.whatsappNumber || listing.owner?.maskedPhone ? (
                                        <a
                                            href={`tel:${listing.owner.whatsappNumber || listing.owner.maskedPhone}`}
                                            className="text-[#b7f041] hover:underline"
                                        >
                                            {listing.owner.whatsappNumber || listing.owner.maskedPhone}
                                        </a>
                                    ) : (
                                        "—"
                                    )
                                }
                            />
                        </div>
                    </AdminCard>

                    {listing.statusReason ? (
                        <AdminCard className="border-red-400/30 bg-red-500/5">
                            <p className="text-sm font-semibold text-red-200">Status note</p>
                            <p className="mt-2 text-sm text-red-100/80">{listing.statusReason}</p>
                        </AdminCard>
                    ) : null}

                    <AdminCard className="space-y-3">
                        <p className="text-sm font-semibold text-white/75">Actions</p>
                        {canApprove ? (
                            <button
                                type="button"
                                onClick={handleApprove}
                                disabled={working}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#b7f041] text-sm font-bold text-[#111] disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Approve & go live
                            </button>
                        ) : null}
                        {canReject ? (
                            <button
                                type="button"
                                onClick={() => setRejectOpen(true)}
                                disabled={working}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 text-sm font-semibold text-red-200 disabled:opacity-60"
                            >
                                <XCircle className="h-4 w-4" /> Reject listing
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setDeleteOpen(true)}
                            disabled={working}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-semibold text-white/70 disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4" /> Delete listing
                        </button>
                    </AdminCard>
                </div>
            </div>

            <AdminConfirmModal
                open={rejectOpen}
                title="Reject this listing?"
                description="The owner will see this listing as rejected."
                confirmLabel="Reject"
                confirmTone="danger"
                loading={working}
                onCancel={() => setRejectOpen(false)}
                onConfirm={handleReject}
            >
                <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Optional reason for rejection"
                    className="min-h-24 w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                />
            </AdminConfirmModal>

            <AdminConfirmModal
                open={deleteOpen}
                title="Delete this listing?"
                description="This removes the listing permanently."
                confirmLabel="Delete"
                confirmTone="danger"
                loading={working}
                onCancel={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
            />

            <PropertyMediaLightbox
                items={gallery}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                title={listing.title}
            />
        </>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
            <p className="mt-1 font-medium text-white">{value}</p>
        </div>
    );
}
