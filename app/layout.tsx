import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Titan_One } from "next/font/google";
import SolanaProviders from "@/components/wallet/SolanaProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const titan = Titan_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-titan",
});

export const metadata: Metadata = {
  title: "CryptoDapp.lol — Bid Your Dapp #1",
  description:
    "Claim the #1 spot for your crypto dapp. Bid in USDC or USDT on Solana, Ethereum, Base, BNB Chain, or Polygon — highest bid ranks first.",
};

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${titan.variable}`}>
      <body>
        <div className="bg-loud" aria-hidden="true">
          <div className="blob-green" />
        </div>
        <SolanaProviders>{children}</SolanaProviders>
        {umamiWebsiteId && (
          <Script src={umamiScriptUrl} data-website-id={umamiWebsiteId} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
