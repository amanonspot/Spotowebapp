"use client";

import React from "react";
import { OwnerContact } from "@/lib/adapters/types";
import SwipeUnlock from "@/components/revamp/SwipeUnlock";

interface OwnerCardProps {
    owner: OwnerContact;
    isUnlocked: boolean;
    onUnlock?: () => void;
}

const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    const local =
        digits.length === 12 && digits.startsWith("91")
            ? digits.slice(2)
            : digits.length === 11 && digits.startsWith("0")
            ? digits.slice(1)
            : digits;
    if (local.length !== 10) return phone;
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
};

export default function OwnerCard({ owner, isUnlocked, onUnlock }: OwnerCardProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#111116] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="p-4">
                {/* Owner name */}
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Owner</p>
                <h3 className="mt-1 text-xl font-bold text-white">{owner.ownerName}</h3>

                {/* Phone */}
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/40">Phone</p>
                <p
                    className={`mt-1 text-xl font-bold tracking-wide text-white transition-all duration-500 ${
                        isUnlocked ? "animate-unlock" : "select-none opacity-80"
                    }`}
                    style={isUnlocked ? {} : { filter: "blur(5px)" }}
                >
                    {isUnlocked ? formatPhone(owner.whatsappNumber) : owner.maskedPhone}
                </p>

                {/* Unlocked indicator */}
                {isUnlocked && (
                    <div className="animate-fade-up mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-400 ring-1 ring-green-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                        Contact Unlocked
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="border-t border-white/8 p-4 pt-3">
                {isUnlocked ? (
                    <div className="flex gap-2.5">
                        <a
                            href={`https://wa.me/${owner.whatsappNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-shimmer flex-1 rounded-xl bg-[#A67AEB] px-4 py-3 text-center text-base font-bold text-white"
                        >
                            WhatsApp
                        </a>
                        <a
                            href={`tel:${owner.whatsappNumber}`}
                            className="btn-shimmer flex-1 rounded-xl border border-[#A67AEB]/50 px-4 py-3 text-center text-base font-bold text-white hover:bg-[#A67AEB]/10"
                        >
                            Call
                        </a>
                    </div>
                ) : (
                    <SwipeUnlock
                        label="Swipe To Unlock"
                        onComplete={async () => {
                            if (!onUnlock) return;
                            await onUnlock();
                        }}
                    />
                )}
            </div>
        </section>
    );
}
