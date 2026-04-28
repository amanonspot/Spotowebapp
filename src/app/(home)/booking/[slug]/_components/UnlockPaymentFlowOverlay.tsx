"use client";

import React from "react";
import { Check, X } from "lucide-react";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { UnlockPaymentContext, UnlockPaymentFlowState } from "@/lib/adapters/types";

interface UnlockPaymentFlowOverlayProps {
    state: UnlockPaymentFlowState;
    context: UnlockPaymentContext | null;
    busy?: boolean;
    errorMessage?: string | null;
    onClosePaywall: () => void;
    onReopenPaywall: () => void;
    onDismissDropoff: () => void;
    onPayNow: () => void;
    onRetryPayment: () => void;
    onContinueFromSuccess: () => void;
}

const houseVisual = (
    <div className="mx-auto mt-6 h-44 w-44 rounded-[2.75rem] border border-white/15 bg-[radial-gradient(circle_at_35%_25%,rgba(183,240,65,0.28),transparent_45%),radial-gradient(circle_at_70%_85%,rgba(166,122,235,0.22),transparent_55%),linear-gradient(145deg,#1a1a27,#0c0c13)] shadow-[0_25px_80px_rgba(0,0,0,0.45)]" />
);

const Shell = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-[#050507f2] backdrop-blur-sm">
        <div className="mx-auto min-h-screen w-full max-w-[720px] px-5 pb-10 pt-6 text-white md:px-8">
            <button
                type="button"
                onClick={onClose}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#A67AEB]/55 bg-[#09090f]/75 text-[#A67AEB] transition hover:border-[#B991F4] hover:text-[#cbb2f2]"
                aria-label="Close"
            >
                <X className="h-9 w-9" />
            </button>
            {children}
        </div>
    </div>
);

export default function UnlockPaymentFlowOverlay({
    state,
    context,
    busy,
    errorMessage,
    onClosePaywall,
    onReopenPaywall,
    onDismissDropoff,
    onPayNow,
    onRetryPayment,
    onContinueFromSuccess,
}: UnlockPaymentFlowOverlayProps) {
    if (state === "idle") return null;

    if (state === "dropoff_prompt") {
        return (
            <Shell onClose={onDismissDropoff}>
                <div className="mt-10 text-center">
                    <p className="text-6xl font-semibold">Wait 👀</p>
                    <p className="mt-3 text-3xl text-white/70">You&apos;re one tap away from your <span className="text-white">Dream House.</span></p>
                    {houseVisual}
                    <p className="mt-10 text-4xl text-white/75">Unlock owner contacts first.</p>
                </div>

                <div className="mt-16">
                    <PrimaryButton onClick={onReopenPaywall} className="h-16 w-full text-3xl" disabled={busy}>
                        Unlock Now 🔓
                    </PrimaryButton>
                </div>
            </Shell>
        );
    }

    if (state === "payment_success") {
        return (
            <Shell onClose={onContinueFromSuccess}>
                <div className="mt-12 text-center">
                    <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#b7f041] text-black">
                        <Check className="h-12 w-12" />
                    </span>
                    <h2 className="mt-6 text-6xl font-semibold">Payment Successful</h2>
                    {houseVisual}
                    <p className="mt-8 text-4xl text-white/75">Your house hunt starts now.</p>
                    <p className="mt-2 text-3xl text-white/60">24h • Unlimited Owner Access</p>
                </div>

                <div className="mt-14">
                    <PrimaryButton onClick={onContinueFromSuccess} className="h-16 w-full text-3xl">
                        Let&apos;s Start
                    </PrimaryButton>
                </div>
            </Shell>
        );
    }

    if (state === "payment_failed") {
        return (
            <Shell onClose={onClosePaywall}>
                <div className="mt-12 text-center">
                    <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#ff3848] text-black">
                        <X className="h-12 w-12" />
                    </span>
                    <h2 className="mt-6 text-6xl font-semibold">Unsuccessful</h2>
                    {houseVisual}
                    <p className="mt-8 text-4xl text-white/75">Retry to</p>
                    <p className="text-4xl text-white/75">Start your House Hunting Now!</p>
                    {errorMessage ? <p className="mt-5 text-base text-red-300">{errorMessage}</p> : null}
                </div>

                <div className="mt-14">
                    <PrimaryButton onClick={onRetryPayment} className="h-16 w-full text-3xl" disabled={busy}>
                        {busy ? "Retrying..." : "Pay Now"}
                    </PrimaryButton>
                </div>
            </Shell>
        );
    }

    return (
        <Shell onClose={onClosePaywall}>
            <div className="mx-auto mt-6 max-w-[620px] text-center">
                {houseVisual}
                <h2 className="mt-6 text-6xl font-semibold text-white/80">Your House Hunting starts here</h2>

                <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/35 bg-[linear-gradient(155deg,#131321,#0c0c13)] text-left shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
                    <div className="bg-[#A67AEB]/15 px-7 py-5 text-[2.35rem] font-semibold text-[#B7F041]">
                        Get Direct Owner&apos;s Contacts 😲
                    </div>
                    <div className="space-y-5 px-7 py-6">
                        <p className="text-5xl font-semibold text-white/85">In Top Bengaluru Localities 📍</p>
                        <p className="text-3xl text-white/75">Unlock verified owner details with</p>
                        <p className="text-5xl font-bold text-white">24-Hrs Unlimited Access – ₹{context?.amount || 99}</p>
                        <ul className="list-disc space-y-2 pl-7 text-3xl text-white/75">
                            <li>Direct Owner Contact</li>
                            <li>Exact map location</li>
                            <li>Unlimited Contacts for 24 hrs*</li>
                            <li>No brokerage</li>
                        </ul>
                    </div>
                    <div className="bg-[#B7F041] px-6 py-4 text-center text-5xl font-extrabold text-[#1a1a1f]">
                        SPOTO Day Pass – ₹99*
                    </div>
                </section>
            </div>

            {errorMessage ? (
                <p className="mx-auto mt-5 max-w-[620px] rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
                    {errorMessage}
                </p>
            ) : null}

            <div className="mx-auto mt-8 max-w-[620px]">
                <PrimaryButton onClick={onPayNow} className="h-16 w-full text-3xl" disabled={busy}>
                    {busy || state === "payment_initiated" ? "Processing..." : "Pay Now"}
                </PrimaryButton>
            </div>
        </Shell>
    );
}
