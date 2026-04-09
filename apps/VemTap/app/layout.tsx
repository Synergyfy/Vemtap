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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vemtap.io";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "VemTap | NFC Visitor Engagement and Loyalty Platform",
        template: "%s | VemTap"
    },
    description: "VemTap helps businesses capture visitor data with NFC taps, grow loyalty, and automate follow-up across customer journeys.",
    keywords: ["VemTap", "NFC visitor engagement", "loyalty platform", "business analytics", "visitor management", "customer retention", "offline to online"],
    authors: [{ name: "VemTap Team" }],
    creator: "VemTap",
    publisher: "VemTap",
    category: "technology",
    alternates: {
        canonical: siteUrl,
    },
    robots: {
        index: true,
        follow: true,
    },
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteUrl,
        siteName: "VemTap",
        title: "VemTap | NFC Visitor Engagement and Loyalty Platform",
        description: "Capture, engage, and retain visitors with NFC-powered check-ins, analytics, and loyalty workflows.",
        images: [
            {
                url: "/VEMTAP_TITLE.png",
                width: 1200,
                height: 630,
                alt: "VemTap platform",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "VemTap | NFC Visitor Engagement and Loyalty Platform",
        description: "Capture visitor data with NFC taps and turn it into retention with loyalty and messaging.",
        images: ["/VEMTAP_TITLE.png"],
    },
    icons: {
        icon: "/VEMTAP_TITLE.png",
        apple: "/VEMTAP_TITLE.png",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

import QueryProvider from "./providers/QueryProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import CookieBanner from "@/components/shared/CookieBanner";
import ToastProvider from "@/components/providers/ToastProvider";
import SupportChatbot from "@/components/shared/SupportChatbot";
import InstallPWA from "@/components/shared/InstallPWA";
import GoogleAuthProvider from "./providers/GoogleAuthProvider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />        
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />  
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://js.paystack.co/v1/inline.js" async></script>
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
                suppressHydrationWarning
            >                <QueryProvider>
                    <AuthProvider>
                        <GoogleAuthProvider>
                            <ToastProvider />
                            {children}
                            <CookieBanner />
                            <SupportChatbot />
                            <InstallPWA />
                        </GoogleAuthProvider>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
