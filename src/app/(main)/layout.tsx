import Header from "@/components/header/page";
import Footer from "@/components/footer/Footer";

/** Nền ấm #f7f5f1 — khớp workspace organizer detail */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f7f5f1]">
      <a href="#main-content" className="sr-only fixed left-4 top-3 z-[60] rounded-xl bg-card px-4 py-3 font-semibold text-foreground shadow-lg focus:not-sr-only focus:fixed focus-visible:outline-2 focus-visible:outline-orange-600">
        Chuyển đến nội dung chính
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 scroll-mt-20 flex-col outline-none">{children}</main>
      <Footer />
    </div>
  );
}
