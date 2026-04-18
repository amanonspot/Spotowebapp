import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Spoto: Book Full Homes at Budget Hotel Prices",
    description: "Book Full Homes at Budget Hotel Prices",
    keywords: ["budget hotels", "full homes", "affordable stays", "home stays", "villas", "budget accommodation"],
    icons: {
        icon: '/logos/icon.png',
        shortcut: '/logos/icon.png',
        apple: '/logos/icon.png',
    },
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
    other: {
        'google': 'notranslate',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" translate="no">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                suppressHydrationWarning={true}
            >
                <Suspense
                    fallback={
                        <div className="w-full h-screen bg-black flex items-center justify-center">
                            <div className="text-white text-xl">Loading...</div>
                        </div>
                    }
                >
                    {children}
                </Suspense>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1a1a1a',
                            color: '#fff',
                            border: '1px solid #333',
                        },
                        success: {
                            style: {
                                background: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #4ade80',
                            },
                        },
                        error: {
                            style: {
                                background: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #ef4444',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
