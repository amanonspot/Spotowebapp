import type { Metadata } from "next";
import { LegalPageLayout, OPERATOR } from "@/components/legal/LegalPageLayout";
import DeleteAccountActions from "@/app/delete-account/_components/DeleteAccountActions";

export const metadata: Metadata = {
    title: "Delete Account | Spoto",
    description: "Delete your Spoto account or read how we handle account removal and data retention.",
};

export default function DeleteAccountPage() {
    return (
        <LegalPageLayout title="Delete Account" subtitle="Spoto — Account deletion">
            <p>
                You can delete your account while signed in using the section below. We call our secure API to remove your
                account. If anything fails, email us at{" "}
                <a href={`mailto:${OPERATOR.email}`} className="text-[#c5acff] underline-offset-2 hover:underline">
                    {OPERATOR.email}
                </a>{" "}
                from your registered address.
            </p>
            <p>
                Where required by law, we may retain certain records (for example, payment or tax-related records) for the
                period mandated by applicable regulations; other personal data will be deleted or anonymised per our
                internal processes.
            </p>
            <p>
                Refund-related terms for payments remain as set out in our{" "}
                <a href="/refund-policy" className="text-[#c5acff] underline-offset-2 hover:underline">
                    Refund Policy
                </a>
                .
            </p>

            <DeleteAccountActions />
        </LegalPageLayout>
    );
}
