"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password,
          userType: "customer",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/customer");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Decoration */}
          <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-12 text-white shadow-2xl">
            <div className="text-6xl mb-6">🛍️</div>
            <h2 className="text-3xl font-bold mb-4 text-center">Manage Your Account</h2>
            <p className="text-green-100 text-center mb-8 text-lg">
              Access your documents and payment history anytime, anywhere.
            </p>
            
            <div className="space-y-4 w-full text-sm">
              <div className="flex items-start">
                <span className="text-2xl mr-4">📄</span>
                <span>View and download your documents</span>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-4">💰</span>
                <span>Track your payment history</span>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-4">🔒</span>
                <span>Secure access to your data</span>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-4">⏱️</span>
                <span>Available 24/7 online</span>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-green-400 text-center w-full">
              <p className="text-xs text-green-200">Developed by: Reddi Sekhar & Muni Rangadu</p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Customer Login</h1>
              <p className="mt-2 text-gray-600">
                View your documents and payment history
              </p>
            </div>

            <div className="card bg-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  Staff member? Login here →
                </Link>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
                ← Back to home
              </Link>
            </div>

            {/* Mobile Developer Credit */}
            <div className="md:hidden mt-8 text-center text-xs text-gray-600">
              <p>Developed by: Reddi Sekhar & Muni Rangadu</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
