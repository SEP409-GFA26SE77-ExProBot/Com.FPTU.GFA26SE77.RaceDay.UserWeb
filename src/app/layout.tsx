import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import ToastProvider from "@/components/providers/ToastProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const APP_TITLE = "RaceDay – Running Events Registration Platform";

export const metadata: Metadata = {
  // absolute: mọi route giữ cùng tên tab (không đổi theo page metadata)
  title: { absolute: APP_TITLE, default: APP_TITLE },
  description:
    "Discover and register for running events, marathons, and trail runs across Vietnam. Your next race starts here.",
  icons: {
    icon: [{ url: "/raceday-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col font-sans`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
