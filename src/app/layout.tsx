import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
});

export const metadata: Metadata = {
  title: "Rivo - Sales Development Platform",
  description: "AI-powered sales development and CRM platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark h-full antialiased ${inter.variable} ${jakarta.variable}`}
    >
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <ThemeProvider>
          <QueryProvider>
            <DashboardShell>{children}</DashboardShell>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

