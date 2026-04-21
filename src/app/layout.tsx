import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://launchpad-audit.vercel.app";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin),
  title: "Launchpad Audit | GitHub Growth Copilot",
  description:
    "Audita repositorios de GitHub y obtén acciones priorizadas para mejorar discoverability, onboarding y tracción.",
  alternates: {
    canonical: appOrigin,
  },
  openGraph: {
    title: "Launchpad Audit | GitHub Growth Copilot",
    description:
      "Audita repositorios de GitHub y obtén acciones priorizadas para mejorar discoverability, onboarding y tracción.",
    url: appOrigin,
    siteName: "Launchpad Audit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Launchpad Audit | GitHub Growth Copilot",
    description:
      "Audita repositorios de GitHub y obtén acciones priorizadas para mejorar discoverability, onboarding y tracción.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
