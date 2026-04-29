"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { userService, authService } from "@/lib/api";
import { clearMockSession } from "@/lib/adapters";
import { clearAuthIntent } from "@/lib/auth/authIntent";
import { useAuth } from "@/lib/hooks/useAuth";

const CONFIRM_PHRASE = "DELETE";

export default function DeleteAccountActions() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [confirmText, setConfirmText] = useState("");
    const [busy, setBusy] = useState(false);

    const canSubmit =
        isAuthenticated && !busy && !authLoading && confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

    const clearLocalSession = useCallback(() => {
        clearMockSession();
        authService.logout();
        clearAuthIntent();
        try {
            localStorage.removeItem("spoto_session_v1");
        } catch {
            // ignore
        }
    }, []);

    const handleDelete = async () => {
        if (!canSubmit) return;
        setBusy(true);
        try {
            await userService.deleteUser();
            clearLocalSession();
            toast.success("Your account has been deleted.");
            router.replace("/auth/login");
        } catch (err: unknown) {
            const message =
                err && typeof err === "object" && "message" in err && typeof (err as Error).message === "string"
                    ? (err as Error).message
                    : "Could not delete your account. Please try again or email support.";
            toast.error(message);
        } finally {
            setBusy(false);
        }
    };

    if (authLoading) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/55">
                Checking your session…
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 sm:px-5">
                <p className="text-sm text-white/75">
                    Sign in with the account you want to remove. Then you can delete it permanently from this page.
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    className="w-full rounded-xl bg-[#A67AEB] px-4 py-3 text-sm font-semibold text-[#14141a] transition hover:bg-[#9575e6]"
                >
                    Sign in to continue
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-4 py-6 sm:px-5">
            <div>
                <h2 className="text-base font-semibold text-red-200/95">Permanently delete account</h2>
                <p className="mt-2 text-sm text-white/70">
                    This removes your Spoto profile and associated data from our systems where possible. This action cannot
                    be undone.
                </p>
            </div>
            <div className="space-y-2">
                <label htmlFor="delete-confirm" className="block text-xs font-medium uppercase tracking-wide text-white/45">
                    Type <span className="font-mono text-white/80">{CONFIRM_PHRASE}</span> to confirm
                </label>
                <input
                    id="delete-confirm"
                    type="text"
                    autoComplete="off"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={CONFIRM_PHRASE}
                    className="w-full rounded-xl border border-white/15 bg-[#0f0f12] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none ring-0 transition focus:border-red-400/50 focus:outline-none"
                />
            </div>
            <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void handleDelete()}
                className="w-full rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100 transition enabled:hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-45"
            >
                {busy ? "Deleting…" : "Delete my account permanently"}
            </button>
        </div>
    );
}
