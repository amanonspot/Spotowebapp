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

            {isUnlocked && owner.documents && owner.documents.length > 0 ? (
                <div className="mt-3 rounded-xl border border-white/15 bg-[#0d0d14] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/65">Verification Documents</p>
                    <div className="mt-2 space-y-2">
                        {owner.documents.map((document, index) => (
                            <a
                                key={`${document.documentUrl}-${index}`}
                                href={document.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg border border-[#A67AEB]/40 px-3 py-2 text-xs text-[#d9c4ff] hover:border-[#A67AEB]"
                            >
                                {document.documentType.replaceAll("_", " ")}
                            </a>
                        ))}
                    </div>
                </div>
            ) : null}

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
