// Sets up the root document: fonts, global styles, metadata, the connection banner and the tooltip provider.
import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";

import { ConnectionBanner } from "@/components/ConnectionBanner";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { locale, t } from "@/lib/i18n";

import "./globals.css";

const TOOLTIP_DELAY_MS = 200;

const uiFont = Be_Vietnam_Pro({
  variable: "--font-ui",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const codeFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: t.common.appTitle,
    template: `%s · ${t.common.appTitle}`,
  },
  description: t.common.appDescription,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={locale} className={`${uiFont.variable} ${codeFont.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ConnectionBanner />
        <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
