"use client";

import { useEffect, useState } from "react";
import { Employee } from "@/types";

export default function SuperAdminSetupPage() {
  const [setupKey, setSetupKey] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [superAdmins, setSuperAdmins] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const fetchSuperAdmins = async (key?: string) => {
    setListLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/super-admins", {
        headers: {
          "x-setup-key": key || setupKey,
        },
      });

      const data = await res.json();
      if (!data.success) {
        setAuthorized(false);
        setSuperAdmins([]);
        setError(data.error || "Unauthorized");
        return;
      }

      setAuthorized(true);
      setSuperAdmins(data.data.items || []);
      setSuccess("");
    } catch (err) {
      console.error(err);
      setError("Failed to load super admins");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // Do not auto-fetch; require explicit credential submission
  }, []);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    await fetchSuperAdmins(setupKey);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/super-admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-setup-key": setupKey,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to create super admin");
        return;
      }

      setSuccess("Super admin created successfully.");
      setForm({ name: "", phone: "", email: "", password: "" });
      await fetchSuperAdmins(setupKey);
    } catch (err) {
      console.error(err);
      setError("Failed to create super admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Setup</h1>
          <p className="text-gray-600 mt-2">
            Provide the host credential to unlock super admin creation and view
            existing super admins.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 space-y-6">
          <form onSubmit={handleAuthorize} className="space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Host credential</span>
              <input
                type="password"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                className="mt-2 input-field"
                placeholder="Enter host setup key"
                required
              />
            </label>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || listLoading}
            >
              {loading || listLoading ? "Checking..." : "Authorize"}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Existing super admins</h2>
              <span className="text-sm text-gray-500">
                Total: {superAdmins.length}
              </span>
            </div>

            {listLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : superAdmins.length === 0 ? (
              <p className="text-gray-500">No super admins found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header text-left">Name</th>
                      <th className="table-header text-left">Email</th>
                      <th className="table-header text-left">Phone</th>
                      <th className="table-header text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {superAdmins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="table-cell font-medium">{admin.name}</td>
                        <td className="table-cell">{(admin as any).email || '-'}</td>
                        <td className="table-cell">{admin.phone}</td>
                        <td className="table-cell">
                          {admin.createdAt
                            ? new Date(admin.createdAt as unknown as string).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create a new super admin</h2>
            <p className="text-sm text-gray-600 mb-4">
              Creation is only available after a valid host credential is provided.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter full name"
                  required
                  disabled={!authorized}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="Enter phone number"
                  required
                  disabled={!authorized}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="Enter email address"
                  disabled={!authorized}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="Enter password"
                  required
                  disabled={!authorized}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={!authorized || loading}
              >
                {loading ? "Saving..." : "Create Super Admin"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
