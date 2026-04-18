import React from "react";
import PaymentPage from "../_components/PaymentPage";

interface PaymentPageProps {
    params: Promise<{
        slug: string;
    }>;
}

function PaymentRoute({ params }: PaymentPageProps) {
    return <PaymentPage />;
}

export default PaymentRoute;
