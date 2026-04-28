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
    <div className="mx-auto mt-3 h-24 w-24 rounded-[1.6rem] border border-white/15 bg-[radial-gradient(circle_at_35%_25%,rgba(183,240,65,0.28),transparent_45%),radial-gradient(circle_at_70%_85%,rgba(166,122,235,0.22),transparent_55%),linear-gradient(145deg,#1a1a27,#0c0c13)] shadow-[0_18px_44px_rgba(0,0,0,0.45)] sm:mt-4 sm:h-[7.5rem] sm:w-[7.5rem] md:h-40 md:w-40" />
);

const Shell = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-[#050507f2] backdrop-blur-sm">
        <div className="mx-auto min-h-screen w-full max-w-[680px] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 text-white sm:px-6 sm:pt-5 md:px-7 md:pt-6">
            <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#A67AEB]/55 bg-[#09090f]/75 text-[#A67AEB] transition hover:border-[#B991F4] hover:text-[#cbb2f2] sm:h-12 sm:w-12 md:h-14 md:w-14"
                aria-label="Close"
            >
                <X className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
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
                <div className="mt-5 text-center sm:mt-7 md:mt-9">
                    <p className="text-2xl font-semibold sm:text-3xl md:text-5xl">Wait 👀</p>
                    <p className="mx-auto mt-2 max-w-[520px] text-lg text-white/70 sm:mt-3 sm:text-xl md:text-2xl">
                        You&apos;re one tap away from your <span className="text-white">Dream House.</span>
                    </p>
                    {houseVisual}
                    <p className="mt-5 text-xl text-white/75 sm:text-2xl md:mt-7 md:text-3xl">Unlock owner contacts first.</p>
                </div>

                <div className="mx-auto mt-7 max-w-[620px] md:mt-9">
                    <PrimaryButton onClick={onReopenPaywall} className="h-11 w-full text-base sm:h-12 sm:text-xl md:h-14 md:text-2xl" disabled={busy}>
                        Unlock Now 🔓
                    </PrimaryButton>
                </div>
            </Shell>
        );
    }

    if (state === "payment_success") {
        return (
            <Shell onClose={onContinueFromSuccess}>
                <div className="mt-6 text-center sm:mt-8 md:mt-11">
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#b7f041] text-black sm:h-18 sm:w-18 md:h-20 md:w-20">
                        <Check className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                    </span>
                    <h2 className="mt-4 text-2xl font-semibold sm:text-3xl md:mt-6 md:text-5xl">Payment Successful</h2>
                    {houseVisual}
                    <p className="mt-5 text-xl text-white/75 sm:text-2xl md:mt-7 md:text-3xl">Your house hunt starts now.</p>
                    <p className="mt-1 text-lg text-white/60 sm:text-xl md:mt-2 md:text-2xl">24h • Unlimited Owner Access</p>
                </div>

                <div className="mx-auto mt-7 max-w-[620px] md:mt-9">
                    <PrimaryButton onClick={onContinueFromSuccess} className="h-11 w-full text-base sm:h-12 sm:text-xl md:h-14 md:text-2xl">
                        Let&apos;s Start
                    </PrimaryButton>
                </div>
            </Shell>
        );
    }

    if (state === "payment_failed") {
        return (
            <Shell onClose={onClosePaywall}>
                <div className="mt-6 text-center sm:mt-8 md:mt-11">
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ff3848] text-black sm:h-18 sm:w-18 md:h-20 md:w-20">
                        <X className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                    </span>
                    <h2 className="mt-4 text-2xl font-semibold sm:text-3xl md:mt-6 md:text-5xl">Unsuccessful</h2>
                    {houseVisual}
                    <p className="mt-5 text-xl text-white/75 sm:text-2xl md:mt-7 md:text-3xl">Retry to</p>
                    <p className="text-xl text-white/75 sm:text-2xl md:text-3xl">Start your House Hunting Now!</p>
                    {errorMessage ? <p className="mt-4 text-sm text-red-300 md:mt-5 md:text-base">{errorMessage}</p> : null}
                </div>

                <div className="mx-auto mt-7 max-w-[620px] md:mt-9">
                    <PrimaryButton onClick={onRetryPayment} className="h-11 w-full text-base sm:h-12 sm:text-xl md:h-14 md:text-2xl" disabled={busy}>
                        {busy ? "Retrying..." : "Pay Now"}
                    </PrimaryButton>
                </div>
            </Shell>
        );
    }

    return (
        <Shell onClose={onClosePaywall}>
            <div className="mx-auto mt-3 max-w-[620px] text-center sm:mt-4 md:mt-6">
                {houseVisual}
                <h2 className="mx-auto mt-3 max-w-[560px] text-[2.1rem] font-semibold leading-[1.06] text-white/80 sm:text-[2.4rem] md:mt-5 md:text-[3.15rem]">
                    Your House Hunting starts here
                </h2>

                <section className="mt-5 overflow-hidden rounded-[1.2rem] border border-white/35 bg-[linear-gradient(155deg,#131321,#0c0c13)] text-left shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:mt-6 sm:rounded-[1.5rem] md:mt-7 md:rounded-[2rem]">
                    <div className="bg-[#A67AEB]/15 px-4 py-3 text-[2rem] font-semibold leading-tight text-[#B7F041] sm:px-5 sm:py-4 sm:text-[2rem] md:px-7 md:py-5 md:text-[2.2rem]">
                        Get Direct Owner&apos;s Contacts 😲
                    </div>
                    <div className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-5 sm:py-5 md:space-y-5 md:px-7 md:py-6">
                        <p className="text-[1.85rem] font-semibold leading-tight text-white/85 sm:text-[2.1rem] md:text-[2.6rem]">In Top Bengaluru Localities 📍</p>
                        <p className="text-[1.45rem] text-white/75 sm:text-xl md:text-2xl">Unlock verified owner details with</p>
                        <p className="text-[2.3rem] font-bold leading-[1.04] text-white sm:text-[2.8rem] md:text-[3.2rem]">24-Hrs Unlimited Access – ₹{context?.amount || 99}</p>
                        <ul className="list-disc space-y-1.5 pl-5 text-[1.2rem] leading-tight text-white/75 sm:space-y-2 sm:pl-6 sm:text-[1.45rem] md:pl-7 md:text-[1.9rem]">
                            <li>Direct Owner Contact</li>
                            <li>Exact map location</li>
                            <li>Unlimited Contacts for 24 hrs*</li>
                            <li>No brokerage</li>
                        </ul>
                    </div>
                    <div className="bg-[#B7F041] px-4 py-3 text-center text-[2.1rem] font-extrabold leading-tight text-[#1a1a1f] sm:px-5 sm:py-3.5 sm:text-[2.2rem] md:px-6 md:py-4 md:text-[2.9rem]">
                        SPOTO Day Pass – ₹99*
                    </div>
                </section>
            </div>

            {errorMessage ? (
                <p className="mx-auto mt-5 max-w-[620px] rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
                    {errorMessage}
                </p>
            ) : null}

            <div className="mx-auto mt-5 max-w-[620px] md:mt-7">
                <PrimaryButton onClick={onPayNow} className="h-11 w-full text-base sm:h-12 sm:text-xl md:h-14 md:text-2xl" disabled={busy}>
                    {busy || state === "payment_initiated" ? "Processing..." : "Pay Now"}
                </PrimaryButton>
            </div>
        </Shell>
    );
}
