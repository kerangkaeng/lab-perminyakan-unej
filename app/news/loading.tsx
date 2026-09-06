export default function Loading() {
  return (
    <div className="grid gap-6 md:grid-cols-3 py-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse space-y-3">
          <div className="h-40 bg-mist rounded-lg" />
          <div className="h-4 bg-mist rounded w-3/4" />
          <div className="h-4 bg-mist rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
