import Link from "next/link";

export function SiteNotice() {
  return (
    <aside aria-label="Beta testing notice" className="site-notice">
      <p><strong>Beta testing</strong> Sprechen is under active testing. Features may change, errors may occur, and progress may be reset. Do not enter sensitive personal information in practice replies.</p>
      <nav aria-label="Legal information">
        <Link href="/imprint">Imprint</Link>
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/data-sharing">Data sharing</Link>
        <Link href="/security">Security</Link>
      </nav>
    </aside>
  );
}