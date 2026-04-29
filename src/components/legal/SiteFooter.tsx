import Link from "next/link";
import { OPERATOR } from "@/components/legal/operatorInfo";

const exploreLinks = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Search stays" },
    { href: "/owner/list-property", label: "List your property" },
] as const;

const legalLinks = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms of Service" },
    { href: "/cancellation-policy", label: "Cancellation Policy" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/delete-account", label: "Delete account" },
] as const;

export default function SiteFooter() {
    return (
        <footer className="relative border-t border-white/[0.07] bg-[#020203] text-white">
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-90"
                style={{
                    background:
                        "linear-gradient(90deg, transparent 0%, rgba(166,122,235,0.45) 50%, transparent 100%)",
                }}
            />
            <div
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[min(90vw,720px)] -translate-x-1/2 rounded-full opacity-[0.12]"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(166,122,235,0.7) 0%, transparent 70%)",
                }}
            />

            <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6 md:pb-14 md:pt-14 lg:px-8">
                <div className="grid gap-11 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
                    <div className="lg:col-span-4">
                        <Link href="/" className="group inline-flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-white transition group-hover:text-[#E8DBFF]">
                                SPOTO
                            </span>
                            <span className="rounded-full border border-[#A67AEB]/35 bg-[#A67AEB]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D4B0FF]">
                                India
                            </span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                            Verified homes &amp; direct owner connections — stay on budget, skip the noise.
                        </p>
                        <p className="mt-5 text-xs leading-relaxed text-white/40">
                            A product of <span className="text-white/55">{OPERATOR.legalName}</span>
                        </p>
                    </div>

                    <div className="lg:col-span-3">
                        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#A67AEB]/90">Explore</h2>
                        <ul className="mt-4 space-y-3">
                            {exploreLinks.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-white/65 transition hover:text-white hover:underline hover:underline-offset-4"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-3">
                        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#A67AEB]/90">Legal</h2>
                        <ul className="mt-4 space-y-3">
                            {legalLinks.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-white/65 transition hover:text-white hover:underline hover:underline-offset-4"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2">
                        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#A67AEB]/90">Contact</h2>
                        <div className="mt-4 space-y-3 text-sm">
                            <a
                                href={`mailto:${OPERATOR.email}`}
                                className="block w-fit rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[#c5acff] transition hover:border-[#A67AEB]/40 hover:bg-[#A67AEB]/10"
                            >
                                {OPERATOR.email}
                            </a>
                            <p className="text-xs leading-relaxed text-white/40">
                                GSTIN <span className="font-mono text-white/55">{OPERATOR.gstin}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        © {new Date().getFullYear()} {OPERATOR.legalName}. All rights reserved.
                    </p>
                    <p className="text-white/35">Made for tenants &amp; homeowners · Bengaluru</p>
                </div>
            </div>
        </footer>
    );
}
