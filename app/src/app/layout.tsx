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
  description: "Interactive daily German practice focused on speaking, listening and vocabulary retention.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sprechen",
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
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
