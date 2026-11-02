import { PresenceProvider } from "@/components/providers/PresenceProvider";
import { ToastProvider } from "@/components/ui";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SoulsChat",
    template: "%s · SoulsChat",
  },
  description:
    "A modern messaging and social discovery app — connect, chat, and meet new people.",
  applicationName: "SoulsChat",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <ToastProvider>
          <PresenceProvider>{children}</PresenceProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
