export interface RazorpayCheckoutPayment {
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    currency: string;
}

export interface RazorpayPaymentResult {
    status: 'success' | 'failed';
    /** Razorpay payment ID — only present on success */
    paymentId?: string;
    /** Razorpay order ID — echoed back on success */
    orderId?: string;
    /** HMAC-SHA256 signature — used for server-side verification */
    signature?: string;
}

export function runRazorpayCheckout(
    payment: RazorpayCheckoutPayment,
    description = "1-Day Unlimited Pass – ₹99"
): Promise<RazorpayPaymentResult> {
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
                handler: (response: {
                    razorpay_payment_id: string;
                    razorpay_order_id: string;
                    razorpay_signature: string;
                }) => {
                    resolve({
                        status: 'success',
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id,
                        signature: response.razorpay_signature,
                    });
                },
                modal: { ondismiss: () => resolve({ status: 'failed' }) },
            };
            const rzp = new RazorpayConstructor(options);
            rzp.on("payment.failed", () => resolve({ status: 'failed' }));
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
        script.onerror = () => resolve({ status: 'failed' });
        document.body.appendChild(script);
    });
}
