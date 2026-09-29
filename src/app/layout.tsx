import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerManager } from "@/components/service-worker-manager";

export const metadata: Metadata = {
  title: "Pequenos Passos",
  description: "Acompanhe as tarefas e conquistas de cada dia.",
  applicationName: "Pequenos Passos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pequenos Passos",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2E5BFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-paper text-ink">
        {children}
        <ServiceWorkerManager />
      </body>
    </html>
  );
}
