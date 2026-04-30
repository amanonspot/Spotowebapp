"use client";

import React from "react";
import { Check, X, Zap, Shield, MapPin, Phone } from "lucide-react";
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

const getPassLabel = () => "1-Day Unlimited Pass";

const getDurationLabel = () => "24-Hrs";

const getContactLimit = () => "Unlimited Contacts for 24 Hrs*";

const getPrice = (context: UnlockPaymentContext | null) => context?.amount || 99;

const Shell = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div
        className="fixed inset-0 z-[140] overflow-y-auto"
        style={{ background: "rgba(5,5,7,0.96)", backdropFilter: "blur(12px)" }}
    >
        <style>{`
            @keyframes overlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(28px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes popIn {
                0% { opacity: 0; transform: scale(0.55); }
                70% { transform: scale(1.08); }
                100% { opacity: 1; transform: scale(1); }
            }
            @keyframes shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
            }
            @keyframes pulseBorder {
                0%, 100% { box-shadow: 0 0 0 0 rgba(183,240,65,0.35); }
                50% { box-shadow: 0 0 0 8px rgba(183,240,65,0); }
            }
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 18px rgba(166,122,235,0.25); }
                50% { box-shadow: 0 0 36px rgba(166,122,235,0.5); }
            }
            .overlay-enter { animation: overlayFadeIn 0.22s ease forwards; }
            .content-enter { animation: slideUp 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
            .icon-pop { animation: popIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
            .btn-pay {
                position: relative;
                overflow: hidden;
                transition: transform 0.15s, box-shadow 0.15s;
            }
            .btn-pay:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(166,122,235,0.4); }
            .btn-pay:active { transform: scale(0.98); }
            .btn-pay::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%);
                background-size: 200% 100%;
                animation: shimmer 2.5s infinite;
            }
            .price-shimmer {
                background: linear-gradient(120deg, #fff 30%, #B7F041 50%, #fff 70%);
                background-size: 200% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                animation: shimmer 3s infinite;
            }
            .card-glow { animation: glow 3s ease-in-out infinite; }
            .cta-bar { animation: pulseBorder 2.5s ease-in-out infinite; }
        `}</style>
        <div className="overlay-enter mx-auto min-h-screen w-full max-w-[620px] px-4 pb-8 pt-4 text-white sm:px-5 sm:pt-5 md:px-6">
            <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#A67AEB]/40 bg-[#0d0d14] text-[#A67AEB] transition-all duration-200 hover:border-[#B991F4] hover:bg-[#A67AEB]/10 hover:text-[#cbb2f2] active:scale-[0.93] sm:h-12 sm:w-12"
                aria-label="Close"
            >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
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

    /* ── Dropoff prompt ─────────────────────────────────────────────── */
    if (state === "dropoff_prompt") {
        return (
            <Shell onClose={onDismissDropoff}>
                <div className="content-enter mt-10 text-center sm:mt-14">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#A67AEB]/30 bg-[#0d0d14] text-4xl shadow-[0_0_40px_rgba(166,122,235,0.2)]">
                        🏠
                    </div>
                    <p className="mt-5 text-2xl font-bold sm:text-3xl">Wait a second 👀</p>
                    <p className="mx-auto mt-3 max-w-[420px] text-base leading-relaxed text-white/65 sm:text-lg">
                        You&apos;re one tap away from your{" "}
                        <span className="font-semibold text-white">Dream House.</span>
                    </p>
                    <p className="mt-3 text-base text-white/55">Unlock owner contacts first.</p>
                </div>
                <div className="content-enter mx-auto mt-8 max-w-[480px]">
                    <button
                        onClick={onReopenPaywall}
                        disabled={busy}
                        className="btn-pay w-full rounded-2xl bg-[#A67AEB] py-3.5 text-base font-bold text-white disabled:opacity-60 sm:text-lg"
                    >
                        Unlock Now 🔓
                    </button>
                </div>
            </Shell>
        );
    }

    /* ── Payment success ────────────────────────────────────────────── */
    if (state === "payment_success") {
        return (
            <Shell onClose={onContinueFromSuccess}>
                <div className="content-enter mt-8 text-center sm:mt-12">
                    <span
                        className="icon-pop mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#B7F041] text-black shadow-[0_0_40px_rgba(183,240,65,0.45)] sm:h-24 sm:w-24"
                    >
                        <Check className="h-11 w-11 sm:h-14 sm:w-14" strokeWidth={3} />
                    </span>
                    <h2 className="mt-5 text-2xl font-bold sm:text-3xl">Payment Successful 🎉</h2>
                    <p className="mt-2 text-base text-white/65 sm:text-lg">Owner contact is now unlocked</p>

                    <div className="mx-auto mt-6 max-w-[420px] rounded-2xl border border-[#B7F041]/25 bg-[#B7F041]/5 px-5 py-4 text-left">
                        <p className="text-sm font-semibold uppercase tracking-wider text-[#B7F041]/70">Your Pass</p>
                        <p className="mt-1 text-xl font-bold text-white">{getPassLabel()}</p>
                        <p className="mt-0.5 text-sm text-white/55">Unlimited owner contacts • No brokerage</p>
                    </div>
                </div>
                <div className="content-enter mx-auto mt-6 max-w-[480px]">
                    <button
                        onClick={onContinueFromSuccess}
                        className="btn-pay w-full rounded-2xl bg-[#A67AEB] py-3.5 text-base font-bold text-white sm:text-lg"
                    >
                        Let&apos;s Start 🚀
                    </button>
                </div>
            </Shell>
        );
    }

    /* ── Payment failed ─────────────────────────────────────────────── */
    if (state === "payment_failed") {
        return (
            <Shell onClose={onClosePaywall}>
                <div className="content-enter mt-8 text-center sm:mt-12">
                    <span className="icon-pop mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#ff3848]/15 text-[#ff3848] ring-2 ring-[#ff3848]/30 sm:h-24 sm:w-24">
                        <X className="h-11 w-11 sm:h-14 sm:w-14" strokeWidth={2.5} />
                    </span>
                    <h2 className="mt-5 text-2xl font-bold sm:text-3xl">Payment Failed</h2>
                    <p className="mt-2 text-base text-white/65 sm:text-lg">
                        Don&apos;t worry — your house hunt isn&apos;t over yet!
                    </p>
                    {errorMessage && (
                        <p className="mx-auto mt-4 max-w-[420px] rounded-xl border border-red-400/25 bg-red-500/8 px-4 py-2.5 text-sm text-red-300">
                            {errorMessage}
                        </p>
                    )}
                </div>
                <div className="content-enter mx-auto mt-6 max-w-[480px]">
                    <button
                        onClick={onRetryPayment}
                        disabled={busy}
                        className="btn-pay w-full rounded-2xl bg-[#A67AEB] py-3.5 text-base font-bold text-white disabled:opacity-60 sm:text-lg"
                    >
                        {busy ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing...
                            </span>
                        ) : "Retry Payment"}
                    </button>
                </div>
            </Shell>
        );
    }

    /* ── Main paywall ───────────────────────────────────────────────── */
    const price = getPrice(context);
    const durationLabel = getDurationLabel();
    const contactLimit = getContactLimit();

    return (
        <Shell onClose={onClosePaywall}>
            <div className="content-enter mx-auto mt-3 max-w-[560px]">

                {/* Hero headline */}
                <div className="text-center">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#A67AEB]/30 bg-[#A67AEB]/10 text-2xl shadow-[0_0_28px_rgba(166,122,235,0.2)]">
                        🏠
                    </div>
                    <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                        Your House Hunting<br />starts here
                    </h2>
                </div>

                {/* Pricing card */}
                <section className="card-glow mt-5 overflow-hidden rounded-2xl border border-white/15 bg-[#0e0e17]">

                    {/* Card header */}
                    <div className="relative overflow-hidden bg-[#A67AEB]/12 px-5 py-3.5">
                        <div
                            className="absolute inset-0 opacity-30"
                            style={{
                                background: "linear-gradient(120deg, transparent 0%, rgba(183,240,65,0.15) 50%, transparent 100%)",
                                backgroundSize: "200% 100%",
                                animation: "shimmer 4s infinite",
                            }}
                        />
                        <p className="relative text-lg font-bold text-[#B7F041]">
                            Get Direct Owner&apos;s Contacts 😲
                        </p>
                    </div>

                    {/* Card body */}
                    <div className="px-5 py-5 space-y-4">
                        <p className="text-xl font-semibold text-white/90">
                            In Top Bengaluru Localities 📍
                        </p>
                        <p className="text-sm text-white/60">Unlock verified owner details with</p>

                        {/* Price block */}
                        <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
                            <p className="price-shimmer text-2xl font-extrabold sm:text-3xl">
                                {durationLabel} Unlimited Access
                            </p>
                            <p className="mt-0.5 text-2xl font-extrabold text-[#B7F041] sm:text-3xl">
                                ₹{price}
                                <span className="ml-1 text-sm font-medium text-[#B7F041]/60">only</span>
                            </p>
                        </div>

                        {/* Feature bullets */}
                        <ul className="space-y-2.5">
                            {[
                                { icon: Phone, text: "Direct Owner Contact" },
                                { icon: MapPin, text: "Exact Map Location" },
                                { icon: Zap, text: contactLimit },
                                { icon: Shield, text: "No Brokerage, No Hidden Fees" },
                            ].map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#B7F041]/10">
                                        <Icon className="h-3.5 w-3.5 text-[#B7F041]" />
                                    </span>
                                    <span className="text-sm text-white/75">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA strip */}
                    <div className="cta-bar bg-[#B7F041] px-5 py-3 text-center">
                        <p className="text-base font-extrabold text-[#111]">
                            SPOTO Day Pass – ₹{price}*
                        </p>
                    </div>
                </section>

                {/* Error */}
                {errorMessage && (
                    <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/8 px-4 py-2.5 text-center text-sm text-red-300">
                        {errorMessage}
                    </p>
                )}

                {/* Pay Now button */}
                <div className="mt-5 pb-2">
                    <button
                        onClick={onPayNow}
                        disabled={busy || state === "payment_initiated"}
                        className="btn-pay w-full rounded-2xl bg-[#A67AEB] py-4 text-base font-bold text-white disabled:opacity-60 sm:text-lg"
                    >
                        {busy || state === "payment_initiated" ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing...
                            </span>
                        ) : (
                            `Pay ₹${price} — Get Access Now`
                        )}
                    </button>
                    <p className="mt-2.5 text-center text-xs text-white/35">
                        Secured by Razorpay • ₹{price} one-time • Cancel anytime
                    </p>
                </div>
            </div>
        </Shell>
    );
}
