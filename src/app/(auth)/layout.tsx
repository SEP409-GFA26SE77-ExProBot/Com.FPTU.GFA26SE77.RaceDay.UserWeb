import type { Metadata } from "next";
import "./auth.css";


export const metadata: Metadata = {
  title: {
    default: "Sign In – RaceDay",
    template: "%s – RaceDay",
  },
  description:
    "Sign in or create your RaceDay account to manage race events, track registrations, and more.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
