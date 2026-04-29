import type { Metadata } from "next";
import { LegalPageLayout, OPERATOR } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
    title: "Privacy Policy | Spoto",
    description: "Spoto privacy policy — how we collect and use tenant and homeowner data.",
};

export default function PrivacyPolicyPage() {
    return (
        <LegalPageLayout title="Privacy Policy" subtitle="Spoto Privacy Policy">
            <p>
                We collect tenant and homeowner data to enable direct connections. By listing a property, homeowners
                consent to sharing their contact details with tenants who unlock access.
            </p>
            <p>We do not sell data outside platform usage. Users must not misuse shared information.</p>
            <p>
                Contact:{" "}
                <a href={`mailto:${OPERATOR.email}`} className="text-[#c5acff] underline-offset-2 hover:underline">
                    {OPERATOR.email}
                </a>
            </p>
        </LegalPageLayout>
    );
}
