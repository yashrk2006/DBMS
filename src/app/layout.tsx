import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { DBMSProvider } from "@/context/DBMSContext";
import { SQLTraceOverlay } from "@/components/dashboard/SQLTraceOverlay";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "DBMS Sync Skills - Smart Career Matching",
  description: "Modern database management and smart career matching platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-25..0&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${plusJakarta.className} antialiased min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <DBMSProvider>
            <ToasterProvider />
            {children}
            <SQLTraceOverlay />
          </DBMSProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
