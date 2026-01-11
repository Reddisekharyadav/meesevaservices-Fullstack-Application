import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seva Center - Business Management",
  description: "Multi-branch service center management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logos/Logo.png" type="image/png" />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
