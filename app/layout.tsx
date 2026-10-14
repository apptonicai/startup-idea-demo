import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadPass",
  description: "Driver lead share demo. Commission is recorded offline. The app never holds money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
