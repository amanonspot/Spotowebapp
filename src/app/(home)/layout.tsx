import { Metadata } from "next";
import { Suspense } from "react";
import AuthLayoutWrapper from "@/components/AuthLayoutWrapper";

export const metadata: Metadata = {
    title: "Spoto: Book Full Homes at Budget Hotel Prices",
    description: "Book Full Homes at Budget Hotel Prices",
    openGraph: {
        title: "Spoto: Book Full Homes at Budget Hotel Prices",
        description: "Book Full Homes at Budget Hotel Prices",
        url: "https://spoto.in",
        siteName: "Spoto",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Spoto: Book Full Homes at Budget Hotel Prices",
        description: "Book Full Homes at Budget Hotel Prices",
    },
};

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutWrapper>
            <Suspense
                fallback={
                    <div className="w-full h-screen bg-black flex items-center justify-center">
                        <div className="text-white text-xl">Loading...</div>
                    </div>
                }
            >
                <div className="w-full min-h-screen bg-black">{children}</div>
            </Suspense>
        </AuthLayoutWrapper>
    );
}
