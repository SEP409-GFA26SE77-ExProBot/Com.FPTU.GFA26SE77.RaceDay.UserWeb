import Link from "next/link";
import { Flag, Globe, Heart, MessageCircle, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-500/25">
                <Flag className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                RaceDay
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your premier platform for discovering and registering for running events across Vietnam.
              From marathons to trail runs — find your next race.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Globe, label: "Website" },
                { icon: Heart, label: "Instagram" },
                { icon: MessageCircle, label: "Twitter" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition-all hover:border-orange-500/40 hover:text-orange-600 hover:bg-orange-500/5 hover:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "All Events", href: "/events" },
                { label: "Trail Runs", href: "/events?tag=trail" },
                { label: "Marathons", href: "/events?tag=marathon" },
                { label: "Results", href: "/results" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-orange-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "FAQ", href: "#" },
                { label: "Contact Us", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-orange-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <span>FPT University, Lot E2a-7, D1 Road, Long Thanh My, Thu Duc City, HCMC</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-orange-500 shrink-0" />
                <span>support@raceday.vn</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-orange-500 shrink-0" />
                <span>+84 28 7300 1866</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/60 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RaceDay. Built with ❤️ for runners in Vietnam.
          </p>
          <p className="text-xs text-muted-foreground">
            Inspired by{" "}
            <a
              href="https://irace.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline font-medium"
            >
              iRace.vn
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
