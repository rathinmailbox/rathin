import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Arial Black proxy — chunky uppercase display sans for headlines.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Etna proxy — sturdy newsy serif for the masthead + meta rows.
const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "rathin.blog",
  description: "Independent stories, sharp perspectives. A modern editorial blog.",
  keywords: ["blog", "news", "publication", "articles", "essays"],
  authors: [{ name: "rathin.blog" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${frankRuhl.variable}`}
    >
      <body className="antialiased bg-background text-foreground">
        {/*
          Dark mode re-enabled. A small toggle sits fixed in the top-right
          corner of public pages (see ThemeToggle). The article body and
          components use CSS variables that adapt to the .dark class.
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
