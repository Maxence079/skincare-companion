import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/lib/contexts/AccessibilityContext";
import { AccessibilityWrapper } from "@/components/accessibility/AccessibilityWrapper";
import { LazyAccessibilityButton } from "@/components/accessibility/LazyAccessibilityButton";
import { SkipNavigation } from "@/components/accessibility/SkipNavigation";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "SkinCare Companion - Your Personalized Skincare Assistant",
  description: "AI-powered skincare companion for professional women seeking premium, personalized skincare routines.",
  manifest: "/manifest.json",
  themeColor: "#6B7F6E",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SkinCare Companion",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased`}
      >
        <AccessibilityProvider>
          <AccessibilityWrapper>
            <SkipNavigation />
            {children}
            <LazyAccessibilityButton />
            <PerformanceMonitor />
          </AccessibilityWrapper>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
