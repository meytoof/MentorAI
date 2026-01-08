export default function SigninLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {children}
    </div>
  );
}
