import type { Metadata } from "next";
import "./globals.css";
import AuthButton from "@/ui/AuthButton";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Nu Mirror",
  description: "Mirror UI prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-dvh bg-white">
            <header className="sticky top-0 z-50">
              <div className="px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AuthButton />
                  </div>
                  <div className="text-sm text-black/50">Nu</div>
                </div>
              </div>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
