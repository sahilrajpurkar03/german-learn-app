import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./legal.css";
import { SiteFooter, SiteNotice } from "@/components/site-notice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const studioSans = DM_Sans({ variable: "--font-studio-sans", subsets: ["latin"], display: "swap" });
const studioDisplay = Fraunces({ variable: "--font-studio-display", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Sprechen - Learn German",
  description: "Everyday German for life in Germany: short daily lessons, reviews that stick, and real conversations.",
  manifest: "/manifest.json",
  // ?v=2 busts every layer that caches by URL (browser HTTP cache, the service worker, and
  // Android's WebAPK icon, which only re-checks when a referenced icon URL actually changes) —
  // bump it again whenever the icon artwork changes.
  icons: { icon: "/favicon.ico?v=2", apple: "/apple-touch-icon.png?v=2" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sprechen",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1321" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${studioSans.variable} ${studioDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><SiteNotice />{children}<SiteFooter /></body>
    </html>
  );
}
