import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flev Activities",
  description: "My personal activities tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        <div className="flex min-h-screen">
          <Navbar/> 
        <main className="flex-1 bg-zinc-50 dark:bg-black">
          {children}
        </main>
         </div>
      </body>
    </html>
  );
}
