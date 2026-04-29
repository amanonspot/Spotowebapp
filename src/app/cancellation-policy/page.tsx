import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
    title: "Cancellation Policy | Spoto",
    description: "Spoto cancellation policy for digital passes and platform use.",
};

export default function CancellationPolicyPage() {
    return (
        <LegalPageLayout title="Cancellation Policy" subtitle="Spoto Cancellation Policy">
            <p>All passes are digital services and non-cancellable once used. Cancellation allowed within 24 hours if unused.</p>
            <p>Spoto may suspend accounts in case of misuse.</p>
        </LegalPageLayout>
    );
}
