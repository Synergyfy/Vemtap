import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-inter",
    display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vemtap.io";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Vemtap",
        template: "%s | Vemtap"
    },
    description: "VemTap is a digital engagement platform designed for businesses to instantly capture customer information through a simple \"tap\" using NFC (Near Field Communication) or QR codes. It is primarily used to replace manual data entry and paper forms, allowing businesses to collect visitor details in under two seconds",
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
        title: "Vemtap",
        description: "VemTap is a digital engagement platform designed for businesses to instantly capture customer information through a simple \"tap\" using NFC (Near Field Communication) or QR codes. It is primarily used to replace manual data entry and paper forms, allowing businesses to collect visitor details in under two seconds",
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
        title: "Vemtap",
        description: "VemTap is a digital engagement platform designed for businesses to instantly capture customer information through a simple \"tap\" using NFC (Near Field Communication) or QR codes. It is primarily used to replace manual data entry and paper forms, allowing businesses to collect visitor details in under two seconds",
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
import AdminViewerBanner from "@/components/admin/control-tower/AdminViewerBanner";
import FloatingBackButton from "@/components/shared/FloatingBackButton";
import ConflictModal from "@/components/ui/ConflictModal";
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${GeistMono.variable}`}>
            <head>
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />  
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            </head>
            <body
                className={`${inter.className} antialiased`}
                suppressHydrationWarning
            >
                <QueryProvider>
                    <AuthProvider>
                        <GoogleAuthProvider>
                            <ToastProvider />
                            <ConflictModal />
                            <AdminViewerBanner />
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
