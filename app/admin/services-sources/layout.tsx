import Link from 'next/link';

export default function ServiceSourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">🔔 Services Sources</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Retour Admin
            </Link>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/services-sources"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold"
            >
              📊 Gestion
            </Link>
          </div>
        </div>
      </nav>
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
