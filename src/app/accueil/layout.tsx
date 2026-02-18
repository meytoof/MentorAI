export default function AccueilLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // La landing page gère sa propre nav et son propre footer
  return <>{children}</>;
}
