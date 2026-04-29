import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
    title: "Refund Policy | Spoto",
    description: "Spoto refund policy for payments and platform access.",
};

export default function RefundPolicyPage() {
    return (
        <LegalPageLayout title="Refund Policy" subtitle="Spoto Refund Policy">
            <p>All payments are non-refundable unless:</p>
            <ul className="list-disc space-y-2 pl-5">
                <li>Payment failure</li>
                <li>Technical issue</li>
                <li>Duplicate payment</li>
            </ul>
            <p>Spoto only provides access to contacts and is not responsible for rental outcomes.</p>
        </LegalPageLayout>
    );
}
