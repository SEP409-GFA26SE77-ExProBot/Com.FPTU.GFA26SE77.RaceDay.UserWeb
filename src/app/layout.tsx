import type { Metadata } from "next";
import { Inter, Roboto_Mono, Saira_Condensed, Poppins } from "next/font/google";
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

const sairaCondensed = Saira_Condensed({
  variable: "--font-saira-condensed",
  weight: ["600", "700", "800"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
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
      className={`${inter.variable} ${robotoMono.variable} ${sairaCondensed.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col font-sans`}>{children}</body>
    </html>
  );
}
