export function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="container-lab py-12">
      <p className="eyebrow mb-3">Dashboard</p>
      <h1 className="mb-8 text-2xl font-display font-semibold md:text-3xl">{title}</h1>
      {children}
    </div>
  );
}
