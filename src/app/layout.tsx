import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemoVox - Assistant Personnel Web",
  description: "Application web intelligente de gestion de tâches et de rendez-vous avec reconnaissance vocale",
  keywords: ["MemoVox", "gestion de tâches", "rendez-vous", "reconnaissance vocale", "assistant personnel", "productivité"],
  authors: [{ name: "MemoVox Team" }],
  openGraph: {
    title: "MemoVox - Assistant Personnel Web",
    description: "Application web intelligente de gestion de tâches et de rendez-vous avec reconnaissance vocale",
    url: "https://memovox.app",
    siteName: "MemoVox",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MemoVox - Assistant Personnel Web",
    description: "Application web intelligente de gestion de tâches et de rendez-vous avec reconnaissance vocale",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
