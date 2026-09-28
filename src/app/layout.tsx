import type { Metadata } from "next";
import { Fraunces, Outfit, Source_Serif_4 } from "next/font/google";
import { Forest } from "@/components/forest";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Archives de Gaélia",
    template: "%s · Gaélia",
  },
  description: "Archives, droits et mémoire de la nation de la terre.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${outfit.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Forest />
        {children}
      </body>
    </html>
  );
}
