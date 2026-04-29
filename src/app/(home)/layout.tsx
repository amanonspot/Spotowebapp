import { Metadata } from "next";
import { Suspense } from "react";
import AuthLayoutWrapper from "@/components/AuthLayoutWrapper";
import SiteFooter from "@/components/legal/SiteFooter";
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
                    <div className="flex h-screen w-full items-center justify-center bg-[#040405]">
                        <div className="text-xl text-white">Loading...</div>
                    </div>
                }
            >
                <div className="flex min-h-screen w-full flex-col bg-[#040405]">
                    <div className="flex-1">{children}</div>
                    <SiteFooter />
                </div>
            </Suspense>
        </AuthLayoutWrapper>
    );
}
