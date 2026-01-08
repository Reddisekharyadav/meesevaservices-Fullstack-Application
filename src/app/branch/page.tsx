"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";

interface Stats {
  totalCustomers: number;
  totalWorkEntries: number;
  pendingWork: number;
  totalRevenue: number;
}

export default function BranchDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalWorkEntries: 0,
    pendingWork: 0,
    totalRevenue: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, workRes, payRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/work-entries"),
          fetch("/api/payments"),
        ]);

        const custData = await custRes.json();
        const workData = await workRes.json();
        const payData = await payRes.json();

        const customers = custData.success ? custData.data : [];
        const workEntries = workData.success ? workData.data : [];
        const payments = payData.success ? payData.data : [];

        const pendingWork = workEntries.filter(
          (w: any) => w.status !== "completed"
        ).length;
        const totalRevenue = payments.reduce(
          (sum: number, p: any) => sum + p.amount,
          0
        );

        setStats({
          totalCustomers: customers.length,
          totalWorkEntries: workEntries.length,
          pendingWork,
          totalRevenue,
        });

        setRecentPayments(payments.slice(0, 5));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Branch Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Customers"
          value={stats.totalCustomers}
          icon="👥"
          color="blue"
        />
        <StatsCard
          title="Work Entries"
          value={stats.totalWorkEntries}
          icon="📝"
          color="purple"
        />
        <StatsCard
          title="Pending Work"
          value={stats.pendingWork}
          icon="⏳"
          color="orange"
        />
        <StatsCard
          title="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="green"
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Payments
        </h2>
        {recentPayments.length === 0 ? (
          <p className="text-gray-500">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Mode</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="table-cell font-medium">
                      {payment.customerName}
                    </td>
                    <td className="table-cell">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.mode === "cash"
                            ? "bg-green-100 text-green-700"
                            : payment.mode === "upi"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {payment.mode.toUpperCase()}
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
