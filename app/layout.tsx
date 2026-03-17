import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-elegant",
});

export const metadata: Metadata = {
  title: "haze.fm",
  description: "A music discovery app that generates playlists from your mood or an artist, with an immersive aesthetic visual experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} ${cormorant.variable}`}>{children}</body>
    </html>
  );
}