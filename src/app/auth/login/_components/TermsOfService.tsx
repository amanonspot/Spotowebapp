import React from "react";

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="space-y-3">
                    <h1 className="text-3xl font-semibold">Spoto Terms &amp; Conditions</h1>
                    <div className="text-sm text-white/80 space-y-1">
                        <p>Operated by Gigstryk Entertainment Private Limited</p>
                        <p>GSTIN: 29AALCG5007D1ZQ</p>
                        <p>
                            Email:{" "}
                            <a
                                href="mailto:gigstrykentertainment@gmail.com"
                                className="text-white underline underline-offset-2 hover:text-white/90"
                            >
                                gigstrykentertainment@gmail.com
                            </a>
                        </p>
                    </div>
                    <p className="text-sm text-white/60">Effective Date: 29 April 2026</p>
                </header>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">1. PLATFORM NATURE</h2>
                    <p>
                        Spoto is a platform that provides tenants access to verified homeowner
                        contact details. We do NOT act as brokers, agents, or intermediaries in
                        rental transactions.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">2. USER AGREEMENT</h2>
                    <p>By using Spoto, you agree to:</p>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>Provide accurate information</li>
                        <li>Use the platform legally</li>
                        <li>Not misuse shared contact details</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">3. HOMEOWNER CONSENT</h2>
                    <p className="font-medium">By listing a property on Spoto:</p>
                    <p>You explicitly agree that:</p>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>Your phone number will be shared with tenants who unlock your listing</li>
                        <li>Tenants may contact you directly</li>
                    </ul>
                    <p>This is a core function of the platform.</p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">4. TENANT RESPONSIBILITY</h2>
                    <p>Tenants agree:</p>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>Not to spam or harass homeowners</li>
                        <li>Use contact details only for genuine house search</li>
                        <li>Respect owner preferences</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">5. PAYMENTS &amp; ACCESS</h2>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>Spoto sells access passes (e.g. ₹99)</li>
                        <li>Payments are for platform access only</li>
                        <li>No guarantee of finding a property</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">6. NO LIABILITY</h2>
                    <p>Spoto is not responsible for:</p>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>Rental agreements</li>
                        <li>Property conditions</li>
                        <li>Fraud, disputes, or misrepresentation</li>
                        <li>Financial losses</li>
                    </ul>
                    <p>All interactions happen at user&apos;s own risk.</p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">7. REFUND &amp; CANCELLATION</h2>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>No refunds after usage</li>
                        <li>Limited refunds only in case of technical/payment errors</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">8. ACCOUNT TERMINATION</h2>
                    <p>We may suspend or terminate accounts if:</p>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>Misuse is detected</li>
                        <li>Policies are violated</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">9. DATA &amp; PRIVACY</h2>
                    <p>We collect user data to:</p>
                    <ul className="list-disc pl-6 space-y-1 text-white/90">
                        <li>Enable connections</li>
                        <li>Improve platform</li>
                    </ul>
                    <p>We do not sell data outside platform usage.</p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">10. ACCOUNT DELETION</h2>
                    <p>Users may request deletion via email.</p>
                    <p>Previously shared data cannot be revoked.</p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">11. MODIFICATIONS</h2>
                    <p>Spoto reserves the right to update terms anytime.</p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">12. GOVERNING LAW</h2>
                    <p>
                        These terms are governed by Indian law, jurisdiction Bengaluru, Karnataka.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
