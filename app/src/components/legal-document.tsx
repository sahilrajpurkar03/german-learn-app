import Link from "next/link";
import { legalDetailsComplete, legalOperator, legalTitles, type LegalPage } from "@/lib/legal";

function OperatorContact() {
  return (
    <p>
      Operator: {legalOperator.name || "Not yet provided"}<br />
      Postal address: <span style={{ whiteSpace: "pre-line" }}>{legalOperator.address || "Not yet provided"}</span><br />
      Country: {legalOperator.country}<br />
      Public contact: {legalDetailsComplete ? <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a> : "Not yet verified"}
    </p>
  );
}

export function LegalDocument({ page }: { page: LegalPage }) {
  return (
    <main className="legal-page">
      <article>
        <Link href="/preview">Sprechen</Link>
        <h1>{legalTitles[page]}</h1>
        <p>Last updated: 12 September 2026. Personal, non-commercial beta project.</p>
        {!legalDetailsComplete && (
          <p className="legal-draft" role="note">
            Draft legal information: the operator has not yet supplied complete identity, postal address, and contact details. These pages are not a completed legal notice. Provider locations, contracts, and retention settings also require operator verification before broader public testing.
          </p>
        )}

        {page === "imprint" && <>
          <h2>Website operator</h2>
          <p>Sprechen is a personal, non-commercial German-learning project operated from Germany. The product name is not a substitute for the legal operator&apos;s identity.</p>
          <OperatorContact />
          <h2>Scope of this project</h2>
          <p>The service provides guided language exercises. It is currently in beta testing and is not a certified language assessment, professional teaching service, or source of medical, legal, or immigration advice.</p>
          <h2>Required operator information</h2>
          <p>The operator must verify which disclosure obligations apply under German law, including the DDG and, where relevant, the MStV. Being non-commercial does not automatically remove all disclosure duties. If applicable, legal form, authorised representative, register and tax details, or editorial responsibility must also be supplied. None of these details has been inferred or invented.</p>
          <h2>Content and images</h2>
          <p>Practice situations are original guided examples, not a reproduction of a textbook. Photographs used in the app were sourced from Unsplash. External services and linked websites have their own terms and privacy notices.</p>
          <p><Link href="/privacy">Privacy policy</Link> · <Link href="/data-sharing">Data sharing policy</Link></p>
        </>}

        {page === "privacy" && <>
          <h2>Controller and contact</h2>
          <p>The website operator is responsible for the processing described here. Contact details, when supplied, are below.</p>
          <OperatorContact />
          <h2>Data collected and purposes</h2>
          <ul>
            <li><strong>Account data:</strong> email address, authentication identifiers, optional display name, and credentials handled by Supabase Auth to create and secure accounts. The app does not store a separate plaintext password database.</li>
            <li><strong>Cloud learning records:</strong> starting band, daily goal, check-in dates, XP, streaks, spaced-repetition results, session timestamps, exercise correctness, and response times support progress and review scheduling.</li>
            <li><strong>Browser-local progress:</strong> assessment answers, chosen interests, chapter completion, conversation checkpoints, saved phrases, review dates, and game scores are stored in this browser, including during the public preview. They are not automatically synchronised across devices. Submitted placement answers are also sent to the app server for validation; only the resulting profile fields are explicitly persisted by that action.</li>
            <li><strong>Personal chapters, when enabled:</strong> selected audio, reviewed transcripts, communication goals, German level, and formality settings are processed to create private learning material. Generated scenarios, short source excerpts, chapter checkpoints, and selected phrase reviews are saved to owner-restricted Supabase tables. The full submitted transcript is not saved with the chapter. Temporary transcription results and job metadata have separate retention below.</li>
            <li><strong>Technical requests:</strong> hosting and authentication providers receive information such as IP address, request URL, browser information, and request time to deliver and secure the service. Operational logs may contain this information. Avoid including personal data in URLs or free-text replies.</li>
          </ul>
          <h2>Speech and microphone</h2>
          <p>Speech input is optional and requests browser microphone permission. Browser speech recognition for practice replies may send audio to the browser or operating-system provider&apos;s remote service; it is not guaranteed to stay on your device. Speech output may also depend on remote voice services. Their processing and retention depend on your device, browser, and chosen voice. Recognised text appears in the reply field; assessment text and saved progress follow the rules above. Typed replies remain available without microphone access. Revoke microphone permission in browser settings whenever you wish.</p>
          <h2>Personal recordings and AI processing</h2>
          <p>My Chapters can capture a short recap or accept an audio upload of up to three minutes and 10 MB. Selecting or recording audio does not by itself upload it. Uploading requires an affirmative confirmation that you have permission to submit everyone&apos;s words and agree to the stated AI processing. Do not record other people without their informed permission; a microphone permission prompt or beta notice does not provide their consent. Avoid sensitive personal data and confidential work material.</p>
          <p>When enabled, audio is uploaded to a private Supabase bucket and sent through the app server to Groq for transcription. You can correct and redact the transcript before separately requesting German chapter generation; redaction at that stage does not undo the provider&apos;s earlier receipt of the audio. For typed recaps, only the submitted text and settings are sent. Groq is an additional processor; processing is not represented as device-only or EU-only. Its published controls offer Zero Data Retention, but the operator must verify the account setting, processing agreement, and applicable international-transfer safeguards before enabling the feature. No automatic transfer to a different AI provider is implemented.</p>
          <h2>Cookies, local storage, and offline assets</h2>
          <p>The browser preference <code>sprechen-beta-notice</code> remembers which version of the beta warning you acknowledged. Accept hides that warning on subsequent visits in the same browser; it does not give consent to data sharing or waive your rights. The footer retains the legal links and can reopen the warning. A changed notice version or cleared browser storage shows it again. If browser storage is unavailable, the acknowledgment lasts only for the current page visit.</p>
          <p>Authentication cookies maintain and refresh your session. Local storage keys beginning with <code>sprechen-studio-v1:</code> hold device-local learning progress; this is not an encrypted private vault. Signing out does not currently erase those records. A service worker caches public application assets; authenticated pages and provider requests are configured network-only. Clearing site data removes local progress and cached assets, but does not delete your Supabase account. No advertising or third-party analytics integration was found in the reviewed application source; hosting-provider telemetry must be confirmed separately.</p>
          <h2>Legal basis</h2>
          <p>The intended basis for processing necessary to provide requested accounts and learning functions is Article 6(1)(b) GDPR. Necessary security and operational processing may rely on Article 6(1)(f), with the interest of maintaining a reliable, abuse-resistant service. Processing legally required records may rely on Article 6(1)(c). Where optional processing requires consent, Article 6(1)(a) applies and consent must be withdrawable. Browser microphone permission is not, by itself, a blanket GDPR consent. The operator must confirm these bases, any applicable TDDDG device-storage requirements, and provider arrangements before treating this draft as final.</p>
          <h2>Recipients and international processing</h2>
          <p>Vercel hosts the app; Supabase provides authentication and the database. Email delivery and optional browser speech services may involve additional providers. See the <Link href="/data-sharing">data sharing policy</Link>. The deployed database region, email provider, contractual safeguards, and any processing outside the EEA have not been independently verified. No EU-only processing claim is made. The operator must assess applicable data-processing agreements and transfer safeguards, such as adequacy decisions or standard contractual clauses where appropriate.</p>
          <h2>Retention and deletion</h2>
          <p>Personal chapter audio is scheduled for removal immediately after processing, on failure, or when discarded. A daily cleanup job retries removal of expired uploads, temporary transcripts, and creation-job metadata after their 24-hour expiry; with normal operation this can take up to about 48 hours from creation. Failures or outages can delay cleanup and require operator intervention. Upload-path metadata is retained until that cleanup so removal can be retried even after a late upload finishes. This is not a promise about independent provider logs or backups.</p>
          <p>Saved personal chapters and their reviews remain until you delete the chapter, the account is deleted, or a beta reset removes them. My Chapters provides chapter export and deletion, including associated progress and reviews. Downloaded exports remain under your control. Unsaved recap text is kept in the open page, not automatically saved across reloads. No automatic retention period is implemented for other account or learning records. Provider logs, email records, and backups follow the providers&apos; configured retention, which the operator still needs to confirm. No immediate deletion from all backups is promised.</p>
          <h2>Your rights</h2>
          <p>Subject to the applicable conditions, you may request access, correction, deletion, restriction, portability, or object to processing. You may withdraw consent for consent-based processing without affecting its prior lawfulness. Personal chapters have export and deletion controls; a complete account export/deletion workflow is not currently implemented. Use the operator contact above once provided for other requests. You may complain to a competent data protection supervisory authority, including the authority in the German federal state where you live or where the operator is established. Clearing browser storage alone is not a cloud-deletion request.</p>
          <h2>Beta and changes</h2>
          <p>Learning estimates are informal and do not make legally significant automated decisions about you. Features and these notices may change. The beta notice is shown until acknowledged in this browser and can be reopened from the footer. Its acknowledgment is not consent to data sharing or a waiver of your rights.</p>
        </>}

        {page === "data-sharing" && <>
          <h2>When information leaves your device</h2>
          <ul>
            <li><strong>Vercel:</strong> serves the website and server actions and may process request metadata and operational logs. Form submissions handled by the server pass through the hosting infrastructure.</li>
            <li><strong>Supabase:</strong> processes account sign-in, recovery requests, profiles, and cloud learning records. Row-level security policies in the repository restrict user-owned records, but the deployed policies still require live verification.</li>
            <li><strong>Email delivery:</strong> authentication and password-reset messages are sent to your email address through Supabase&apos;s configured delivery service. The actual email provider has not been confirmed.</li>
            <li><strong>Browser/OS speech providers:</strong> may receive voice audio or synthesis text when optional speech features are used. Availability and processing vary by platform.</li>
            <li><strong>Groq, for enabled personal chapters:</strong> receives submitted audio for transcription and reviewed text/settings for German learning-material generation. Temporary audio and resulting chapters pass through the hosting server and private Supabase storage. The operator must verify retention controls, contracts, and international-transfer safeguards; no paid-provider failover is implemented.</li>
          </ul>
          <h2>What is not shared by an app feature</h2>
          <p>The reviewed app has no advertising, data-sale, public learner profile, or social data-sharing feature. Built-in chapter progress is browser-local; personal chapters and their progress are private cloud records, not a shared leaderboard. This does not mean no data reaches the infrastructure providers listed above. Fonts and app photographs are served as app assets rather than requiring visitors to fetch them directly from Google Fonts or Unsplash.</p>
          <h2>Access and disclosure</h2>
          <p>The operator and authorised provider personnel may have administrative access needed to run or support the service. Information may also be disclosed where legally required. Sharing for a new, unrelated purpose requires an appropriate legal basis and updated information; this notice does not authorise arbitrary sharing.</p>
          <h2>Your choices</h2>
          <p>You can use the public preview without an account and type instead of using speech. The preview still makes hosting requests and stores progress locally. Do not put real health, financial, identity-document, or other sensitive information into exercise replies. Account data requests use the contact in the <Link href="/privacy">privacy policy</Link> once the operator supplies it.</p>
          <h2>Provider references</h2>
          <ul>
            <li><a href="https://vercel.com/legal/privacy-policy" rel="noreferrer">Vercel privacy policy</a></li>
            <li><a href="https://supabase.com/privacy" rel="noreferrer">Supabase privacy policy</a></li>
            <li><a href="https://console.groq.com/docs/your-data" rel="noreferrer">Groq data handling and retention controls</a></li>
          </ul>
          <p>Provider links are supporting references, not a replacement for the operator&apos;s own disclosures, contracts, or verification of the live configuration.</p>
        </>}

        {page === "security" && <>
          <h2>Beta testing</h2>
          <p>Sprechen is a personal, non-commercial beta. Bugs, interruptions, and progress resets are possible. Do not rely on it for emergencies, official certificates, or decisions about health, law, or immigration.</p>
          <h2>Implemented safeguards</h2>
          <ul>
            <li>Supabase authentication and server-side checks protect account routes. User-owned database tables have ownership policies in the repository migrations.</li>
            <li>Authenticated responses use private/no-store caching, and the service worker excludes private pages and external provider responses from runtime caching.</li>
            <li>Browser headers restrict framing, content-type sniffing, object embedding, camera/geolocation access, and cross-origin form submissions. Microphone permission is limited to this origin.</li>
            <li>Dependency checks, static checks, and automated browser tests support development. These checks are not a security certification or a guarantee that vulnerabilities are absent.</li>
            <li>Personal chapter endpoints require authentication and same-origin mutations, restrict AI output to validated lesson data, and enforce creation quotas in the database. Private source content is not inserted into public vocabulary tables. Live deployment configuration still requires verification.</li>
          </ul>
          <h2>Known limits</h2>
          <p>Device-local progress is accessible to someone using the same browser profile and should not contain secrets. Practice scores are not tamper-proof or suitable for ranking or certification. Production infrastructure, provider contracts, backup retention, and live database isolation need independent verification. This project has not completed an independent penetration test.</p>
          <h2>Report a concern</h2>
          <p>Contact the operator listed in the <Link href="/imprint">imprint</Link> privately once that contact has been supplied. Share a short description and steps to reproduce using your own test account; do not send passwords, reset links, access tokens, or another person&apos;s data. Do not access other accounts or run disruptive tests on the live service.</p>
        </>}
      </article>
    </main>
  );
}