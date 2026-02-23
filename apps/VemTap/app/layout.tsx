import type { Metadata } from "next";
// import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// Force rebuild

// const inter = Inter({
//     subsets: ["latin"],
//     variable: "--font-body",
// });

// const outfit = Outfit({
//     subsets: ["latin"],
//     variable: "--font-display",
// });

export const metadata: Metadata = {
    title: {
        default: "Visitor Engagement Management",
        template: "%s | VemTap"
    },
    description: "Visitor Engagement Management - Tap. Seamless offline-to-online visitor data capture with our NFC-powered platform.",
    keywords: ["VemTap", "NFC data capture", "offline to online", "lead generation", "visitor management", "digital marketing"],
    authors: [{ name: "VemTap Team" }],
    creator: "VemTap",
    publisher: "VemTap",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: "website",
        locale: "en_GB",
        url: "https://vemtap.io/",
        siteName: "VemTap",
        title: "VemTap - Visitor Engagement Management",
        description: "Seamless offline-to-online visitor data capture. Visitor Engagement Management - Tap.",
        images: [
            {
                url: "/assets/vemtap_v.png",
                width: 800,
                height: 600,
                alt: "VemTap Logo",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "VemTap - Visitor Engagement Management",
        description: "Seamless offline-to-online visitor data capture. Visitor Engagement Management - Tap.",
        images: ["/assets/vemtap_v.png"],
    },
    icons: {
        icon: "/icons/icon-192.png",
        apple: "/icons/icon-192.png",
    },
};

import QueryProvider from "./providers/QueryProvider";
import CookieBanner from "@/components/shared/CookieBanner";
import ToastProvider from "@/components/providers/ToastProvider";
import SupportChatbot from "@/components/shared/SupportChatbot";
import InstallPWA from "@/components/shared/InstallPWA";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <style dangerouslySetInnerHTML={{
                    __html: `
            :root {
              --font-body: 'Inter', sans-serif;
              --font-display: 'Outfit', sans-serif;
            }
          `}} />
            </head>
            <body
                className={`antialiased font-sans`}
                style={{ fontFamily: "var(--font-body)" }}
            >
                <QueryProvider>
                    <ToastProvider />
                    {children}
                    <CookieBanner />
                    <SupportChatbot />
                    <InstallPWA />
                </QueryProvider>
            </body>
        </html>
    );
}
