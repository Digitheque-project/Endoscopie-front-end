import Link from 'next/link';

export default function ServicesExternesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">🔌 Services Externes</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              ← Retour Admin
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/services-externes"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold"
            >
              📊 Gestion
            </Link>
            <Link
              href="/admin/services-externes/send-instructions"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold"
            >
              📧 Envoyer Instructions
            </Link>
            <Link
              href="/admin/services-externes/guide-api"
              className="px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold"
            >
              📚 Guide Complet
            </Link>
          </div>
        </div>
      </nav>
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
