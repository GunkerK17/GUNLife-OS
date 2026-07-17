import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "GunLifeOS",
    template: "%s | GunLifeOS",
  },
  description: "GunLifeOS - personal life operating system",
  applicationName: "GunLifeOS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GunLifeOS",
  },
  icons: {
    icon: [
      {
        url: "/icons/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: "/icons/favicon-32.png",
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#020817",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "min-h-screen bg-background text-foreground antialiased font-[family-name:var(--font-geist-sans)]",
        )}
      >
        <QueryProvider>
          <I18nProvider>{children}</I18nProvider>
        </QueryProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
