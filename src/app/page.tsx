import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Seva Center</h1>
        <p className="text-xl text-primary-100 mb-8">
          Multi-Branch Business Management System
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-64 mx-auto bg-white text-primary-700 font-semibold py-3 px-6 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Staff Login
          </Link>
          <Link
            href="/customer-login"
            className="block w-64 mx-auto bg-primary-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-400 transition-colors border border-primary-400"
          >
            Customer Login
          </Link>
        </div>

        <div className="mt-12 text-primary-200 text-sm">
          <p>Track work • Manage payments • Store documents</p>
        </div>
      </div>
    </main>
  );
}
