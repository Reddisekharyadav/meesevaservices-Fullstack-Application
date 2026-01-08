"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { WorkEntry, Customer, Branch } from "@/types";

export default function WorkEntriesPage() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formData, setFormData] = useState({
    customerId: "",
    description: "",
    amount: "",
    paymentMode: "pending" as "cash" | "upi" | "test" | "pending",
    branchId: "",
  });

  const fetchData = async () => {
    try {
      const [entriesRes, custRes, branchRes] = await Promise.all([
        fetch(`/api/work-entries?date=${selectedDate}`),
        fetch("/api/customers"),
        fetch("/api/branches"),
      ]);

      const entriesData = await entriesRes.json();
      const custData = await custRes.json();
      const branchData = await branchRes.json();

      if (entriesData.success) setEntries(entriesData.data);
      if (custData.success) setCustomers(custData.data);
      if (branchData.success) setBranches(branchData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleOpenModal = () => {
    setFormData({
      customerId: "",
      description: "",
      amount: "",
      paymentMode: "pending",
      branchId: branches[0]?.id.toString() || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/work-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          description: formData.description,
          amount: parseFloat(formData.amount) || 0,
          paymentMode: formData.paymentMode,
          branchId: parseInt(formData.branchId),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to create work entry");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleMarkComplete = async (id: number) => {
    try {
      const res = await fetch(`/api/work-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      const data = await res.json();

      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  };

  const getPaymentBadge = (mode: string) => {
    const badges: Record<string, string> = {
      cash: "bg-green-100 text-green-700",
      upi: "bg-blue-100 text-blue-700",
      test: "bg-purple-100 text-purple-700",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return badges[mode] || badges.pending;
  };

  const filteredCustomers = formData.branchId
    ? customers.filter((c) => c.branchId.toString() === formData.branchId)
    : customers;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Entries</h1>
        <button onClick={handleOpenModal} className="btn-primary">
          + Add Entry
        </button>
      </div>

      {/* Date Filter */}
      <div className="card mb-6 flex items-center gap-4">
        <label className="font-medium text-gray-700">Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field max-w-xs"
          aria-label="Select date"
        />
        <div className="ml-auto text-lg font-semibold text-gray-900">
          Total: ₹{totalAmount.toLocaleString()}
        </div>
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <p className="text-gray-500">No work entries for this date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Employee</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="table-cell font-medium">
                      {entry.customerName}
                    </td>
                    <td className="table-cell">{entry.description}</td>
                    <td className="table-cell">₹{entry.amount.toLocaleString()}</td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(
                          entry.paymentMode
                        )}`}
                      >
                        {entry.paymentMode}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="table-cell">{entry.employeeName}</td>
                    <td className="table-cell">
                      {entry.status !== "completed" && (
                        <button
                          onClick={() => handleMarkComplete(entry.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Work Entry"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={formData.branchId}
              onChange={(e) =>
                setFormData({ ...formData, branchId: e.target.value, customerId: "" })
              }
              className="input-field"
              aria-label="Branch"
              required
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={formData.customerId}
              onChange={(e) =>
                setFormData({ ...formData, customerId: e.target.value })
              }
              className="input-field"
              aria-label="Customer"
              required
            >
              <option value="">Select Customer</option>
              {filteredCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field"
              rows={3}
              placeholder="Enter work description"
              required
            />
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
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMode: e.target.value as typeof formData.paymentMode,
                  })
                }
                className="input-field"
                aria-label="Payment Mode"
              >
                <option value="pending">Pending</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="test">Test Payment</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Create Entry
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
