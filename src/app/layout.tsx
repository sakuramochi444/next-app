import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Stock Management App",
  description: "A stock management application built with Next.js.",
};

type Props = {
  children: React.ReactNode;
};

const RootLayout: React.FC<Props> = (props) => {
  const { children } = props;
  return (
    <html lang="ja" className={`${dmSerif.variable} ${dmSans.variable}`}>
      <body className="antialiased selection:bg-retro-highlight selection:text-retro-secondary">
        <Toaster position="bottom-right" />
        <main>{children}</main>
        <footer className="py-10 text-center text-sm text-retro-secondary/40 border-t border-retro-secondary/5 mt-auto">
          <p className="font-serif">Inventory Archive System</p>
          <p className="mt-1">© {new Date().getFullYear()} Club Equipment Manager</p>
        </footer>
      </body>
    </html>
  );
};

export default RootLayout;
