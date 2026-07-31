import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Maison — Premium Fashion Store",
  description: "Timeless pieces crafted from the world's finest materials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <CartDrawer />
        <main>{children}</main>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { background: "#1a1a1a", color: "#fff", fontSize: "0.8rem", letterSpacing: "0.05em" },
            success: { iconTheme: { primary: "#c8a96e", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
