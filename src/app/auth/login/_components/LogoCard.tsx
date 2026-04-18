import React from "react";
import Image from "next/image";

export default function LogoCard() {
    return (
        <div
            className="rounded-b-4xl w-full px-8 flex items-center justify-center h-56"
            style={{
                background:
                    "linear-gradient(180deg, #1D1528 0%, #231B31 12%, #060606 42%, #060606 75%, transparent 100%)",
                borderBottom: "1px solid #976ADD",
                paddingTop: "5rem",
                paddingBottom: "1.5rem",
                marginTop: "0",
                marginBottom: "0"
            }}
        >
            <Image
                src="/logos/light.png"
                alt="Logo"
                width={240}
                height={80}
                className="h-auto"
                priority
            />
        </div>
    );
}
