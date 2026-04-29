import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/components/legal/SiteFooter";
import { OPERATOR, OFFICE_ADDRESS_LINES } from "@/components/legal/operatorInfo";

export { OPERATOR, OFFICE_ADDRESS_LINES } from "@/components/legal/operatorInfo";

export function LegalPageLayout({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    return (
        <>
            <div className="min-h-screen bg-[#040405] text-white">
                <div className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
                    <Link
                        href="/"
                        className="mb-8 inline-flex text-sm font-medium text-[#c5acff] transition-colors hover:text-white"
                    >
                        ← Back to home
                    </Link>

                    <header className="mb-8 space-y-2 border-b border-white/10 pb-8">
                        <p className="text-sm font-medium uppercase tracking-wide text-[#A67AEB]">{title}</p>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{subtitle}</h1>

                        <div className="pt-4 text-sm leading-relaxed text-white/80">
                            <p>
                                <span className="text-white/50">Operated by </span>
                                {OPERATOR.legalName}
                            </p>
                            <p>
                                <span className="text-white/50">GSTIN: </span>
                                {OPERATOR.gstin}
                            </p>
                            <p>
                                <span className="text-white/50">Email: </span>
                                <a
                                    href={`mailto:${OPERATOR.email}`}
                                    className="text-[#c5acff] underline-offset-2 hover:underline"
                                >
                                    {OPERATOR.email}
                                </a>
                            </p>
                        </div>
                    </header>

                    <div className="space-y-6 text-[15px] leading-relaxed text-white/85 sm:text-base">{children}</div>

                    <section className="mt-12 border-t border-white/10 pt-8 text-sm leading-relaxed text-white/70">
                        <h2 className="mb-3 text-base font-semibold text-white">Registered office address</h2>
                        <address className="not-italic">
                            {OFFICE_ADDRESS_LINES.map((line) => (
                                <p key={line}>{line}</p>
                            ))}
                        </address>
                    </section>
                </div>
            </div>
            <SiteFooter />
        </>
    );
}
