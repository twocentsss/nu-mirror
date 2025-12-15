import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nu Mirror",
  description: "Mirror UI prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {children}
      </body>
    </html>
  );
}
