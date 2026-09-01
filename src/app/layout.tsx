import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./font.css";
// import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
// import BackgroundMusic from "../components/BackgroundMusic/BackgroundMusic";
import CookieConsent from "../components/Cookies/CookieConsent";
import ContactUsButton from "../components/Contactusbutton/contact_us_button";
import { generateOrganizationSchema } from "@/lib/seo";
import { Metadata, Viewport } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.supportstudio.tech'),
  title: {
    default: "Support Studio Technologies | Enterprise SAP & IT Consulting GCC",
    template: "%s | Support Studio Technologies"
  },
  description: "Support Studio Technologies (SST) provides premium SAP consulting, IT managed services, and digital transformation solutions for enterprises in the UAE, Saudi Arabia, and the wider GCC region.",
  keywords: [
    "SAP Consulting GCC",
    "IT Services UAE",
    "Digital Transformation Saudi Arabia",
    "Enterprise Software Solutions",
    "Cloud Managed Services",
    "S/4HANA Migration Dubai",
    "IT Strategy Riyadh"
  ],
  authors: [{ name: "Support Studio Technologies", url: "https://www.supportstudio.tech" }],
  creator: "Support Studio Technologies Engineering",
  publisher: "Support Studio Technologies",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-us",
      "en-AE": "/en-ae",
      "en-SA": "/en-sa",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.supportstudio.tech",
    siteName: "Support Studio Technologies",
    title: "Support Studio Technologies | Enterprise SAP & IT Consulting GCC",
    description: "Leading SAP and IT consulting firm specializing in enterprise digital transformation across the GCC region.",
    images: [
      {
        url: "/og-image.png", // Asset request tracking in pending_assets.md
        width: 1200,
        height: 630,
        alt: "Support Studio Technologies Enterprise Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Studio Technologies | SAP & IT Experts",
    description: "Enterprise SAP and IT consulting services for the GCC market.",
    images: ["/twitter-image.png"], // Asset request tracking in pending_assets.md
    creator: "@SST_Tech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "pending_verification_code", // TODO: Add once provided
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = generateOrganizationSchema();

  return (
    <html lang="en" className="scroll-smooth" style={{ "--lineWidth": "2px" } as React.CSSProperties}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-blue-500 selection:text-white`}>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        {/* <ScrollToTop /> */}
        {/* <ContactUsButton /> */}
        {/* <BackgroundMusic /> */}
        <CookieConsent />
      </body>
    </html>
  );
}
