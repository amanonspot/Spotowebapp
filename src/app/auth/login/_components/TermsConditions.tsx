import React from "react";
import Link from "next/link";

const TermsConditions: React.FC = () => {
  return (
    <p className="text-white/50 text-sm text-center leading-relaxed font-opensans">
      By continuing, you agree to our{" "}
      <Link
        href="/terms-of-service"
        className="text-white/70 hover:text-white underline underline-offset-2"
      >
        Terms of Service
      </Link>
      {" and "}
      <Link
        href="/privacy-policy"
        className="text-white/70 hover:text-white underline underline-offset-2"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
};

export default TermsConditions;
