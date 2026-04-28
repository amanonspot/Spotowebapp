"use client";

import React from "react";
import { OwnerContact } from "@/lib/adapters/types";
import PrimaryButton from "@/components/revamp/PrimaryButton";

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
        <section className="rounded-2xl border border-white/15 bg-[#111116] p-4">
            <p className="text-sm text-white/60">Owner</p>
            <h3 className="mt-0.5 text-xl font-semibold text-white">{owner.ownerName}</h3>

            <p className="mt-3 text-sm text-white/60">Phone no</p>
            <p className="mt-0.5 text-xl font-semibold tracking-wide text-white">
                {isUnlocked ? formatPhone(owner.whatsappNumber) : owner.maskedPhone}
            </p>


            <div className="mt-4 flex gap-2">
                {isUnlocked ? (
                    <>
                        <a
                            href={`https://wa.me/${owner.whatsappNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-xl bg-[#A67AEB] px-4 py-3 text-center text-base font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            WhatsApp
                        </a>
                        <a
                            href={`tel:${owner.whatsappNumber}`}
                            className="flex-1 rounded-xl border border-[#A67AEB] px-4 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-[#A67AEB]/10"
                        >
                            Call
                        </a>
                    </>
                ) : (
                    <PrimaryButton variant="ghost" className="w-full" onClick={onUnlock}>
                        Unlock to Contact
                    </PrimaryButton>
                )}
            </div>
        </section>
    );
}
