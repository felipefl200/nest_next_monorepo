import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "@repo/tailwind-config/globals.css";
import { ModeToggle } from "@repo/ui/components/mode-toggle";
import { ThemeProvider } from "@repo/ui/theme-provider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Web",
  description: "Next.js 16 app in the monorepo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={manrope.variable} lang="pt-BR" suppressHydrationWarning>
      <body className="relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="absolute top-4 right-4 z-50">
            <ModeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
