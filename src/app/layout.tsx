import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "H2O Flow | Premium Personal Water Tracker",
  description: "Track your daily water intake with premium glassmorphism visuals, custom volume presets, streaks, and weekly analytics to keep your hydration in flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

