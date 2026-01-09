"use client";

import { useEffect, useState } from "react";
import { Branch } from "@/types";

interface ReportData {
  daily: {
    date: string;
    totalAmount: number;
    cashAmount: number;
    upiAmount: number;
    testAmount: number;
    workCount: number;
  }[];
  byBranch: {
    branchId: number;
    branchName: string;
    totalAmount: number;
    paymentCount: number;
    workCount: number;
    customerCount: number;
  }[];
  summary: {
    totalRevenue: number;
    totalPayments: number;
    totalWorks: number;
    totalCustomers: number;
    totalDocuments: number;
  };
}

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    daily: [],
    byBranch: [],
    summary: { totalRevenue: 0, totalPayments: 0, totalWorks: 0, totalCustomers: 0, totalDocuments: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    branchId: "",
  });

  const fetchBranches = async () => {
    const res = await fetch("/api/branches");
    const data = await res.json();
    if (data.success) setBranches(data.data);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      if (filters.branchId) params.append("branchId", filters.branchId);

      // Fetch all three report types
      const [dailyRes, branchRes, summaryRes] = await Promise.all([
        fetch(`/api/reports?type=daily&${params}`),
        fetch(`/api/reports?type=branch&${params}`),
        fetch(`/api/reports?type=summary&${params}`),
      ]);

      const [dailyData, branchData, summaryData] = await Promise.all([
        dailyRes.json(),
        branchRes.json(),
        summaryRes.json(),
      ]);

      setReportData({
        daily: dailyData.success ? dailyData.data || [] : [],
        byBranch: branchData.success ? branchData.data || [] : [],
        summary: summaryData.success && summaryData.data ? summaryData.data : { totalRevenue: 0, totalPayments: 0, totalWorks: 0, totalCustomers: 0, totalDocuments: 0 },
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchReports();
  }, []);

  const handleApplyFilters = () => {
    fetchReports();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Filters */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="input-field"
              title="Start Date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="input-field"
              title="End Date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={filters.branchId}
              onChange={(e) =>
                setFilters({ ...filters, branchId: e.target.value })
              }
              className="input-field"
              title="Branch"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleApplyFilters} className="btn-primary w-full">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="card bg-green-50">
              <p className="text-sm text-green-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{(reportData.summary?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="card bg-indigo-50">
              <p className="text-sm text-indigo-600 font-medium">Payments</p>
              <p className="text-2xl font-bold text-indigo-700">
                {reportData.summary?.totalPayments || 0}
              </p>
            </div>
            <div className="card bg-blue-50">
              <p className="text-sm text-blue-600 font-medium">Work Entries</p>
              <p className="text-2xl font-bold text-blue-700">
                {reportData.summary?.totalWorks || 0}
              </p>
            </div>
            <div className="card bg-purple-50">
              <p className="text-sm text-purple-600 font-medium">Customers</p>
              <p className="text-2xl font-bold text-purple-700">
                {reportData.summary?.totalCustomers || 0}
              </p>
            </div>
            <div className="card bg-orange-50">
              <p className="text-sm text-orange-600 font-medium">Documents</p>
              <p className="text-2xl font-bold text-orange-700">
                {reportData.summary?.totalDocuments || 0}
              </p>
            </div>
          </div>

          {/* Daily Report */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Breakdown
            </h2>
            {reportData.daily.length === 0 ? (
              <p className="text-gray-500">No data for selected period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Date</th>
                      <th className="table-header">Cash</th>
                      <th className="table-header">UPI</th>
                      <th className="table-header">Total</th>
                      <th className="table-header">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.daily.map((day, idx) => (
                      <tr key={idx}>
                        <td className="table-cell font-medium">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="table-cell">₹{(day.cashAmount || 0).toLocaleString()}</td>
                        <td className="table-cell">₹{(day.upiAmount || 0).toLocaleString()}</td>
                        <td className="table-cell">
                          ₹{(day.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="table-cell">{day.workCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Branch Report */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Branch Performance
            </h2>
            {reportData.byBranch.length === 0 ? (
              <p className="text-gray-500">No branch data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Branch</th>
                      <th className="table-header">Customers</th>
                      <th className="table-header">Payments</th>
                      <th className="table-header">Work Entries</th>
                      <th className="table-header">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.byBranch.map((branch) => (
                      <tr key={branch.branchId}>
                        <td className="table-cell font-medium">
                          {branch.branchName}
                        </td>
                        <td className="table-cell">{branch.customerCount || 0}</td>
                        <td className="table-cell">{branch.paymentCount || 0}</td>
                        <td className="table-cell">{branch.workCount || 0}</td>
                        <td className="table-cell">
                          ₹{(branch.totalAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
