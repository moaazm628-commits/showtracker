import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./AuthContext";
import Header from "./Header";

export const metadata: Metadata = {
  title: "watchverse",
  description: "your universe of tv shows-rate, review, debate and dicover",
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
        </AuthProvider>
      </body>
    </html>
  );
}