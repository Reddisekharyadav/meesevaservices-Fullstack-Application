"use client";

import { useEffect, useState } from "react";

interface Payment {
  id: number;
  amount: number;
  mode: string;
  status: string;
  notes: string;
  createdAt: string;
}

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/payments");
        const data = await res.json();
        if (data.success) setPayments(data.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h1>

      {/* Summary */}
      <div className="card mb-6 bg-green-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">
              Total Amount Paid
            </p>
            <p className="text-2xl font-bold text-green-700">
              ₹{totalPaid.toLocaleString()}
            </p>
          </div>
          <span className="text-4xl">💰</span>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl mb-4 block">💳</span>
          <p className="text-gray-500">No payments found.</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Mode</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="table-cell">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell font-medium">
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
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="table-cell">{payment.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
