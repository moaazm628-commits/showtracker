import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./AuthContext";
import Header from "./Header";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "WatchVerse",
  description: "Your universe of TV shows - rate, review and discover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col bg-gray-950">
        <AuthProvider>
          <Header />
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}