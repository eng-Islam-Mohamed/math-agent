import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Agent | Live Portfolio Demo",
  description: "Try a live mathematical reasoning demo with tiered models and a second AI review pass.",
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
