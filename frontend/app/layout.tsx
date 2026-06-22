import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeSync } from "@/components/theme/theme-sync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI-Assisted-System-for-Cancer-Detection-",
  description: "Research and education platform for AI-assisted oncology imaging workflows."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
