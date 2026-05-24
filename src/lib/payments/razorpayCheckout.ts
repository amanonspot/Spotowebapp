export interface RazorpayCheckoutPayment {
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    currency: string;
}

export function runRazorpayCheckout(
    payment: RazorpayCheckoutPayment,
    description = "1-Day Unlimited Pass – ₹99"
): Promise<"success" | "failed"> {
    return new Promise((resolve) => {
        const openCheckout = () => {
            const RazorpayConstructor = (window as unknown as Record<string, unknown>).Razorpay as new (opts: unknown) => {
                open: () => void;
                on: (event: string, cb: () => void) => void;
            };
            const options = {
                key: payment.razorpayKeyId,
                amount: payment.amount,
                currency: payment.currency,
                order_id: payment.razorpayOrderId,
                name: "SPOTO",
                description,
                theme: { color: "#A67AEB" },
                handler: () => resolve("success"),
                modal: { ondismiss: () => resolve("failed") },
            };
            const rzp = new RazorpayConstructor(options);
            rzp.on("payment.failed", () => resolve("failed"));
            rzp.open();
        };

        if ((window as unknown as Record<string, unknown>).Razorpay) {
            openCheckout();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = openCheckout;
        script.onerror = () => resolve("failed");
        document.body.appendChild(script);
    });
}
