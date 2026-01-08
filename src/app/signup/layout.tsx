import Navbar from "@/components/ui/Navbar";

export default function SignupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <Navbar />
      {children}
    </div>
  );
}
