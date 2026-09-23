import Header from "@/components/header/page";
import Footer from "@/components/footer/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex flex-col flex-1">{children}</main>
      <Footer />
    </>
  );
}
