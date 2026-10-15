import Header from "@/components/header/page";
import Footer from "@/components/footer/Footer";

/** Nền ấm #f7f5f1 — khớp workspace organizer detail */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f7f5f1]">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
