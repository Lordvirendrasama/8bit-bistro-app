import type { Metadata, Viewport } from "next";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

const APP_NAME = "The 8Bit Bistro";
const APP_DESCRIPTION =
  "Retro Arcade Event App for high scores and leaderboards.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#24B55F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative flex min-h-screen flex-col">
          <FirebaseClientProvider>
            <ClientLayout>{children}</ClientLayout>
          </FirebaseClientProvider>
        </div>
      </body>
    </html>
  );
}
