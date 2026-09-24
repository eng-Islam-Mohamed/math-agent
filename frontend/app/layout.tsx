import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maths AI Agent | Portfolio",
  description: "Solve math problems from text, photos, or voice with step-by-step explanations and AI review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
