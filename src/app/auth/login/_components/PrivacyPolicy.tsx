import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">SPOTO PRIVACY POLICY (Users)</h1>
        <p className="text-sm text-white/60">Effective date: 1 November 2025</p>

        <p>
          This Privacy Policy explains how Spoto (“Spoto”, “we”, “us”, or “our”) collects, uses,
          discloses, stores and protects personal data of users (“you”, “User”, “Guest”) of our website,
          mobile applications and related services (together, the “Platform”). By using the Platform or
          providing personal data to Spoto, you consent to the collection and processing described in this
          Policy.
        </p>

        <p>
          <strong>Short version:</strong> We collect contact & booking information (name, phone, email,
          WhatsApp, booking history, messages), certain limited payment metadata (e.g., last-4 digits or token
          IDs) for reconciliation, device/usage data and KYC documents where required. We do NOT store your
          full bank account numbers, UPI IDs, card PAN or CVV on our systems. All payment instruments are
          collected and processed by our third-party payment gateway partners (who are contractually
          required to be compliant with applicable payment rules, PCI-DSS and RBI tokenisation guidance).
        </p>

        <h2 className="text-xl font-semibold">1. Scope & legal bases</h2>
        <p>1.1 This Policy applies to personal data that Spoto collects from Users in India and to related transactional and operational uses.</p>
        <p>1.2 We process personal data on lawful bases permitted under applicable Indian law, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Performance of a contract (to confirm & manage bookings and payments).</li>
          <li>Consent (for marketing communications, WhatsApp messages and certain personalised features).</li>
          <li>Legitimate interests (fraud prevention, platform security, service improvement), subject to balancing tests.</li>
        </ul>
        <p>1.3 Where we rely on consent, you may withdraw consent at any time (see “Your rights”, §12). Withdrawal does not affect processing already lawfully completed.</p>

        <h2 className="text-xl font-semibold">2. Personal data we collect</h2>
        <p>Depending on how you use Spoto, we may collect:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account & identity: full name, profile photo, government ID numbers where required for verification/KYC.</li>
          <li>Contact & communications: email, mobile phone number, WhatsApp number (if you provide one), postal address.</li>
          <li>Booking & transaction data: reservation dates, number of guests, booking history, messages with hosts, reviews and ratings.</li>
          <li>Payment metadata (limited): we do not store full payment credentials (PAN, CVV, full bank account numbers or UPI credentials). For reconciliation and customer service we may retain non-sensitive metadata such as: transaction IDs, payment gateway token identifiers, masked card digits (e.g., last 4 digits) and refund references.</li>
          <li>Device & usage: IP address, device identifiers, browser/app version, cookies, logs, analytics and crash reports.</li>
          <li>Communications & user content: messages you send to hosts or to Spoto, images or documents you upload, support chats.</li>
          <li>Other information: any additional information you provide (for example, dietary preferences, accessibility needs) and KYC/support documents when required by Host or by law.</li>
        </ul>

        <h2 className="text-xl font-semibold">3. How we collect data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Directly from you when you register, book, message a host, upload documents, contact support or opt-in for marketing.</li>
          <li>From Hosts to the extent necessary to complete bookings.</li>
          <li>From third parties: payment gateways (for transaction status and metadata), identity verification providers, analytics and cloud service providers.</li>
          <li>Automatically through use of the Platform (cookies, logs, analytics).</li>
        </ul>

        <h2 className="text-xl font-semibold">4. Why we use your data (purposes)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Create & manage your account and provide the Platform (contract performance).</li>
          <li>Confirm, fulfil and manage bookings, payments, cancellations and refunds.</li>
          <li>Communicate booking information, check-in/check-out instructions and operational messages by email, SMS, WhatsApp and phone.</li>
          <li>Provide optional marketing, promotions and personalised recommendations (only if you consent).</li>
          <li>Prevent, detect and investigate fraud and abuse; protect platform security and rights.</li>
          <li>Provide customer support and resolve disputes between Guests and Hosts.</li>
          <li>Comply with legal, tax and regulatory obligations.</li>
          <li>Improve our products and services via aggregated analytics.</li>
        </ul>

        <h2 className="text-xl font-semibold">5. Payments and payment data — important (no storage on our systems)</h2>
        <p>
          Spoto does not store your full card details (PAN/CVV), full bank account numbers, or UPI credentials on our servers.
          All sensitive payment data is collected, tokenised and processed by our third-party payment gateway partners.
        </p>
        <p>
          For customer support and reconciliation we may retain limited, non-sensitive metadata (examples: last 4 digits of card,
          payment gateway token, transaction ID, refund reference). Such metadata alone cannot be used to complete a new payment.
        </p>
        <p>
          Our payment partners are contractually required to comply with applicable laws and standards (including RBI guidance and PCI-DSS where applicable).
          If you have questions about how a specific payment method is handled, we will provide the relevant processor’s privacy/payment notice on request.
        </p>
        <p>
          Never share CVV or full PAN in support chats or messages. If you mistakenly share such details, contact support immediately so we can advise and escalate.
        </p>

        <h2 className="text-xl font-semibold">6. Marketing & WhatsApp communications</h2>
        <p>
          We will only send marketing/promotional messages by email, SMS or WhatsApp if you have opted in to receive marketing.
          You may opt out at any time by using the unsubscribe link or by contacting us (see §17).
        </p>
        <p>
          Operational and transactional messages necessary to complete bookings (confirmation, urgent notices such as host cancellations or safety alerts) may be sent even if you have not opted into marketing.
          These are considered necessary to perform the contract.
        </p>
        <p>
          WhatsApp messages are delivered via third-party messaging providers and are subject to WhatsApp’s terms; Spoto will not share your WhatsApp messages with unauthorised third parties.
        </p>

        <h2 className="text-xl font-semibold">7. Sharing your data</h2>
        <p>
          We share personal data only as necessary to provide the Platform and as required by law:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Hosts & property managers: your contact & booking information for fulfilment.</li>
          <li>Payment processors & banks: to process payments, refunds and payouts. These providers manage sensitive payment credentials; Spoto shares only necessary metadata or payment references.</li>
          <li>Service providers: cloud hosting, analytics, identity verification, fraud detection, email/SMS/WhatsApp vendors, customer support platforms — all under contract with confidentiality and security obligations.</li>
          <li>Legal & regulatory authorities: in response to lawful requests or to comply with legal obligations.</li>
          <li>Business transfers: in connection with mergers, acquisitions or asset sales, subject to confidentiality and notice.</li>
        </ul>
        <p>
          We require third parties to implement appropriate technical and organisational safeguards.
        </p>

        <h2 className="text-xl font-semibold">8. Cross-border transfers</h2>
        <p>
          Personal data may be processed in or transferred to service providers located outside India (for example, cloud providers or analytics vendors).
          Where we transfer personal data overseas we will do so only on lawful bases and with appropriate contractual safeguards to protect your rights.
        </p>

        <h2 className="text-xl font-semibold">9. Data retention</h2>
        <p>
          We retain personal data only for as long as necessary to fulfil the purposes described in this Policy,
          to comply with legal obligations and to resolve disputes. Typical retention periods:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Booking & transactional records: up to 7 years (for statutory/tax reasons or as law requires).</li>
          <li>Support communications and logs: typically up to 2 years, unless needed longer for dispute resolution.</li>
          <li>Marketing preferences: until you withdraw consent.</li>
        </ul>
        <p>
          When data is no longer required we will delete it or anonymise it in a manner that it can no longer be used to identify you.
        </p>

        <h2 className="text-xl font-semibold">10. Security</h2>
        <p>
          We implement commercially reasonable technical and organisational measures to protect personal data against
          unauthorised access, disclosure, alteration or destruction (encryption in transit (TLS), access controls,
          logging, vulnerability management and staff training). We require our service providers (including payment partners)
          to meet comparable security standards. No system is completely secure; residual risk remains.
        </p>

        <h2 className="text-xl font-semibold">11. Data breach response & notification</h2>
        <p>
          If we become aware of a personal data breach that is likely to result in risk to the rights and freedoms of individuals,
          Spoto will promptly contain and investigate the incident. Where required by applicable Indian law and operational guidance,
          Spoto will notify the relevant authority and affected individuals without undue delay and in any event in accordance with applicable
          legal timelines (for material breaches we aim to follow the commonly referenced 72-hour initial notification practice where applicable).
          We will also take remedial measures to reduce harm.
        </p>

        <h2 className="text-xl font-semibold">12. Your rights & how to exercise them</h2>
        <p>
          Subject to applicable law, you may:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Request access to the personal data we hold about you.</li>
          <li>Request correction of inaccurate/incomplete data.</li>
          <li>Request deletion of your personal data (subject to legal/contractual retention requirements).</li>
          <li>Withdraw marketing consent at any time (withdrawal does not affect processing already completed).</li>
          <li>Object to or restrict certain processing where applicable.</li>
          <li>Request portability of certain personal data in a commonly used machine-readable format where applicable.</li>
        </ul>
        <p>
          To exercise your rights, contact our Grievance Officer (see §17). We will verify identity before responding and will respond within the timelines required by law.
        </p>

        <h2 className="text-xl font-semibold">13. Children</h2>
        <p>
          The Platform is intended for users aged 18 or older. We do not knowingly collect personal data of children under 18.
          If we become aware that we have collected data of a child, we will take reasonable steps to delete it.
        </p>

        <h2 className="text-xl font-semibold">14. Cookies & similar technologies</h2>
        <p>
          We and our partners use cookies and similar technologies for authentication, security, analytics and to personalise your experience.
          You can control cookie settings in your browser and via the preference tools we provide on the Platform. Blocking certain cookies may degrade functionality.
        </p>

        <h2 className="text-xl font-semibold">15. Third-party links & third-party policies</h2>
        <p>
          Our Platform may contain links to third-party websites and services. This Policy does not apply to third parties — please read their privacy notices before providing personal data.
        </p>

        <h2 className="text-xl font-semibold">16. Changes to this Policy</h2>
        <p>
          We may update this Policy to reflect legal, technical or business changes. Material changes will be highlighted and posted with a revised Effective Date.
          Continued use of the Platform after changes constitutes acceptance of the updated Policy.
        </p>

        <h2 className="text-xl font-semibold">17. Grievance Officer & contact</h2>
        <p>
          Grievance Officer / Privacy Contact
          <br />
          Email: gigstrykentertainment@gmail.com
          <br />
          Alternate email: aman@gigstrykentertainment.com
          <br />
          Phone: +91- 7002130551 / 9902713551
          <br />
          Registered Office / Postal Address:
          <br />
          5th Floor, Tower A, INNOV8 MANTRI COMMERCIO,
          <br />
          Survey No: 51/3, 51/4, 51/2 & 39/5,
          <br />
          Devara Beesana Halli, Bengaluru – 560103
          <br />
          If you are not satisfied with our response you may escalate to the relevant authority under Indian law.
        </p>

        <h2 className="text-xl font-semibold">18. Acknowledgement & legal note</h2>
        <p>
          By using the Platform and providing personal data to Spoto, you acknowledge that you have read and understood this Privacy Policy
          and consent to the collection, use and disclosure of personal data as described herein.
        </p>
        <p>
          Legal note: This Policy is a practical template tailored to Spoto’s current operations and the facts you provided.
          It is recommended that you obtain review and approval from qualified Indian legal counsel (and any local counsel for Karnataka) before publishing
          to ensure full compliance with the latest statutory requirements (including the Digital Personal Data Protection Act and RBI/PCI guidance) and any industry-specific obligations.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
