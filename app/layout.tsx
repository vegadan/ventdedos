import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import { Special_Elite } from "next/font/google";


import "./globals.css";

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vent de Dos",
  description: "Carnet de voyage à vélo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}