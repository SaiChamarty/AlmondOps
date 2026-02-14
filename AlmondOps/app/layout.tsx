import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Almond Risk Report",
  description: "One click clear actions for the next 72 hours",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
