import type { Metadata } from "next";
import { Suspense } from "react";
import AuthLayoutWrapper from "@/components/AuthLayoutWrapper";
import SiteFooter from "@/components/legal/SiteFooter";
import { getPublicSiteUrl } from "@/lib/runtime/publicEnv";
export const metadata: Metadata = {
    title: "Spoto: Let's find a new House",
    description: "Spoto: Let's find a new House",
    openGraph: {
        title: "Spoto: Let's find a new House",
        description: "Spoto: Let's find a new House",
        url: getPublicSiteUrl(),
        siteName: "Spoto",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Spoto: Let's find a new House",
        description: "Spoto: Let's find a new House",
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
