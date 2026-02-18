import LandingNav from "@/components/ui/LandingNav";
import Footer from "@/components/ui/Footer";

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <LandingNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
