"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";

interface Summary {
  totalRevenue: number;
  totalWorks: number;
  totalCustomers: number;
  totalDocuments: number;
}

interface DailyReport {
  date: string;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  testAmount: number;
  workCount: number;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, dailyRes] = await Promise.all([
          fetch("/api/reports?type=summary"),
          fetch("/api/reports?type=daily"),
        ]);

        const summaryData = await summaryRes.json();
        const dailyData = await dailyRes.json();

        if (summaryData.success) {
          setSummary(summaryData.data);
        }

        if (dailyData.success) {
          setDailyReports(dailyData.data.slice(0, 7));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={`₹${summary?.totalRevenue?.toLocaleString() || 0}`}
          icon="💰"
          color="green"
        />
        <StatsCard
          title="Total Works"
          value={summary?.totalWorks || 0}
          icon="📝"
          color="blue"
        />
        <StatsCard
          title="Total Customers"
          value={summary?.totalCustomers || 0}
          icon="👥"
          color="purple"
        />
        <StatsCard
          title="Total Documents"
          value={summary?.totalDocuments || 0}
          icon="📄"
          color="yellow"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Summary (Last 7 Days)
        </h2>

        {dailyReports.length === 0 ? (
          <p className="text-gray-500">No work entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Works</th>
                  <th className="table-header">Cash</th>
                  <th className="table-header">UPI</th>
                  <th className="table-header">Test</th>
                  <th className="table-header">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dailyReports.map((report) => (
                  <tr key={report.date}>
                    <td className="table-cell">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="table-cell">{report.workCount}</td>
                    <td className="table-cell text-green-600">
                      ₹{report.cashAmount.toLocaleString()}
                    </td>
                    <td className="table-cell text-blue-600">
                      ₹{report.upiAmount.toLocaleString()}
                    </td>
                    <td className="table-cell text-purple-600">
                      ₹{report.testAmount.toLocaleString()}
                    </td>
                    <td className="table-cell font-semibold">
                      ₹{report.totalAmount.toLocaleString()}
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
