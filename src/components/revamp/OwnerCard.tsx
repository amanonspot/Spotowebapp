"use client";

import React from "react";
import { OwnerContact } from "@/lib/adapters/types";
import PrimaryButton from "@/components/revamp/PrimaryButton";

interface OwnerCardProps {
    owner: OwnerContact;
    isUnlocked: boolean;
}

export default function OwnerCard({ owner, isUnlocked }: OwnerCardProps) {
    return (
        <section className="rounded-2xl border border-white/15 bg-[#111116] p-4">
            <p className="text-xs text-white/60">Owner</p>
            <h3 className="text-2xl font-semibold text-white">{owner.ownerName}</h3>

            <p className="mt-3 text-xs text-white/60">Phone no</p>
            <p className="text-2xl font-semibold text-white">{isUnlocked ? owner.whatsappNumber : owner.maskedPhone}</p>

            <div className="mt-4 flex gap-3">
                {isUnlocked ? (
                    <>
                        <a
                            href={`https://wa.me/${owner.whatsappNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-xl bg-[#A67AEB] px-4 py-3 text-center text-base font-semibold text-white"
                        >
                            WhatsApp
                        </a>
                        <a
                            href={`tel:${owner.whatsappNumber}`}
                            className="flex-1 rounded-xl border border-[#A67AEB] px-4 py-3 text-center text-base font-semibold text-white"
                        >
                            Call
                        </a>
                    </>
                ) : (
                    <PrimaryButton variant="ghost" className="w-full" disabled>
                        Unlock to Contact
                    </PrimaryButton>
                )}
            </div>
        </section>
    );
}
