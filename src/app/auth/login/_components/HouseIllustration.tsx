import React from "react";
import Image from "next/image";
import loginIcon from "../../../../../public/assets/images/login-icon.svg";

export default function HouseIllustration() {
    return (
        <div className="flex justify-center mb-6">
            <Image
                src={loginIcon}
                alt="login-icon"
                width={200}
                height={200}
                className="w-[200px] h-auto"
                priority
            />
        </div>
    );
}
