"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { Payment, Customer, WorkEntry } from "@/types";

export default function BranchPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    workEntryId: "",
    amount: "",
    mode: "cash" as "cash" | "upi" | "test",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [paymentsRes, custRes, workRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/customers"),
        fetch("/api/work-entries"),
      ]);

      const paymentsData = await paymentsRes.json();
      const custData = await custRes.json();
      const workData = await workRes.json();

      if (paymentsData.success) setPayments(paymentsData.data);
      if (custData.success) setCustomers(custData.data);
      if (workData.success) setWorkEntries(workData.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      customerId: "",
      workEntryId: "",
      amount: "",
      mode: "cash",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          workEntryId: formData.workEntryId
            ? parseInt(formData.workEntryId)
            : null,
          amount: parseFloat(formData.amount),
          mode: formData.mode,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const getModeBadge = (mode: string) => {
    const badges: Record<string, string> = {
      cash: "bg-green-100 text-green-700",
      upi: "bg-blue-100 text-blue-700",
      test: "bg-purple-100 text-purple-700",
    };
    return badges[mode] || badges.cash;
  };

  const pendingWorkEntries = workEntries.filter(
    (w) =>
      w.status !== "completed" &&
      (!formData.customerId ||
        w.customerId.toString() === formData.customerId)
  );

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <button onClick={handleOpenModal} className="btn-primary">
          + Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Total Collected
          </h2>
          <p className="text-2xl font-bold text-green-600">
            ₹{totalPayments.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card">
        {payments.length === 0 ? (
          <p className="text-gray-500">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Mode</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="table-cell font-medium">
                      {payment.customerName}
                    </td>
                    <td className="table-cell">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getModeBadge(
                          payment.mode
                        )}`}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={formData.customerId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customerId: e.target.value,
                  workEntryId: "",
                })
              }
              className="input-field"
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to Work Entry (Optional)
            </label>
            <select
              value={formData.workEntryId}
              onChange={(e) =>
                setFormData({ ...formData, workEntryId: e.target.value })
              }
              className="input-field"
            >
              <option value="">No linked work entry</option>
              {pendingWorkEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.description} - ₹{entry.amount}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                value={formData.mode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mode: e.target.value as typeof formData.mode,
                  })
                }
                className="input-field"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="input-field"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Record Payment
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
