import React from "react";

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-white px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-semibold">
                    SPOTO Terms and Conditions
                </h1>

                <p className="text-sm text-white/60">
                    Effective Date: 1st November 2025
                </p>

                <p>
                    Welcome to <strong>Spoto (Gigstryk Entertainment Private Limited)</strong>,
                    India’s trusted platform for flexi rentals and vacation stays.
                </p>

                <p>
                    By accessing, browsing, or making a booking through our website,
                    mobile app, or any related services (“Platform”), you agree to these
                    Terms and Conditions.
                </p>

                <h2 className="text-xl font-semibold">1. Introduction</h2>
                <p>
                    Spoto is an online marketplace connecting guests (“Users”) with
                    property owners or managers (“Hosts”).
                </p>

                <h2 className="text-xl font-semibold">2. Eligibility</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li>You must be at least 18 years old</li>
                    <li>Use the platform lawfully</li>
                    <li>Comply with applicable laws</li>
                </ul>

                <h2 className="text-xl font-semibold">3. Booking & Payments</h2>
                <p>
                    Full payment is required at the time of booking. All confirmed
                    reservations are binding.
                </p>

                <h2 className="text-xl font-semibold">4. Cancellation & Refunds</h2>
                <p className="font-medium">
                    All bookings are non-cancellable and non-refundable.
                </p>

                <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
                <p>
                    Spoto shall not be liable for any losses or damages incurred during
                    your stay.
                </p>

                <h2 className="text-xl font-semibold">Contact</h2>
                <p>
                    Gigstryk Entertainment Private Limited<br />
                    📧 aman@gigstrykentertainmnet.com<br />
                    📞 +91-7002130551
                </p>
            </div>
        </div>
    );
};

export default TermsOfService;
