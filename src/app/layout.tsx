import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Agentation } from "agentation";
import ErrorTracker from "@/components/ErrorTracker";

export const metadata: Metadata = {
  title: "Tạp Hóa ACC | Mua Bán Tài Khoản Game Giá Rẻ Uy Tín",
  description: "Tạp Hóa ACC - Mua bán tài khoản game giá rẻ, uy tín. Liên Quân Mobile, TFT, Blox Fruits, FC Online và nhiều game khác.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <head>
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <ErrorTracker />
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
