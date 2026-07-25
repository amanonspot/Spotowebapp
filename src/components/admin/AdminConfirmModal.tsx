"use client";

import PrimaryButton from "@/components/revamp/PrimaryButton";
import { AdminCard } from "@/components/admin/AdminCard";

export function AdminConfirmModal({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    confirmTone = "primary",
    loading = false,
    onConfirm,
    onCancel,
    children,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    confirmTone?: "primary" | "danger" | "green";
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    children?: React.ReactNode;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
            <AdminCard className="w-full max-w-md" onClick={(event) => event.stopPropagation()}>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                {description ? <p className="mt-1 text-sm text-white/60">{description}</p> : null}
                {children ? <div className="mt-4">{children}</div> : null}
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white/80"
                    >
                        Cancel
                    </button>
                    {confirmTone === "danger" ? (
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="h-11 rounded-xl border border-red-400/40 bg-red-500/15 px-4 text-sm font-semibold text-red-200 disabled:opacity-60"
                        >
                            {loading ? "Working…" : confirmLabel}
                        </button>
                    ) : confirmTone === "green" ? (
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="h-11 rounded-xl bg-[#b7f041] px-4 text-sm font-semibold text-[#111] disabled:opacity-60"
                        >
                            {loading ? "Working…" : confirmLabel}
                        </button>
                    ) : (
                        <PrimaryButton className="h-11 w-full" onClick={onConfirm} disabled={loading}>
                            {loading ? "Working…" : confirmLabel}
                        </PrimaryButton>
                    )}
                </div>
            </AdminCard>
        </div>
    );
}
