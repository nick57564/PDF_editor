import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import Nav from "@/components/Nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PDF Editor — Free, no account required",
  description: "Edit, merge, sign and annotate PDFs for free. No account. Files stay on your device.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body style={{ background: "#f5f4f0", color: "#0c0c0c", minHeight: "100vh" }}>
        <Script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "your-domain.vercel.app"} src="https://plausible.io/js/script.js" />
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
