import LandingNav from "@/components/ui/LandingNav";
import Footer from "@/components/ui/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060c18] text-neutral-100">
      <LandingNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
