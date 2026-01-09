"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { WorkEntry, Customer } from "@/types";

export default function BranchWorkPage() {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    description: "",
    amount: "",
    status: "pending",
  });

  const fetchData = async () => {
    try {
      const [workRes, custRes] = await Promise.all([
        fetch("/api/work-entries"),
        fetch("/api/customers"),
      ]);

      const workData = await workRes.json();
      const custData = await custRes.json();

      if (workData.success) setWorkEntries(workData.data);
      if (custData.success) setCustomers(custData.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (entry?: WorkEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        customerId: entry.customerId.toString(),
        description: entry.description,
        amount: entry.amount.toString(),
        status: entry.status,
      });
    } else {
      setEditingEntry(null);
      setFormData({ customerId: "", description: "", amount: "", status: "pending" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingEntry
      ? `/api/work-entries/${editingEntry.id}`
      : "/api/work-entries";
    const method = editingEntry ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          description: formData.description,
          amount: parseFloat(formData.amount),
          status: formData.status,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Operation failed");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
    };
    return badges[status] || badges.pending;
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Work Entries</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          + Add Work Entry
        </button>
      </div>

      <div className="card">
        {workEntries.length === 0 ? (
          <p className="text-gray-500">No work entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="table-cell font-medium">
                      {entry.customerName}
                    </td>
                    <td className="table-cell">{entry.description}</td>
                    <td className="table-cell">₹{entry.amount}</td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          entry.status
                        )}`}
                      >
                        {entry.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleOpenModal(entry)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
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
        title={editingEntry ? "Edit Work Entry" : "Add Work Entry"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              title="Select a customer for the work entry"
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
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field"
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
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="input-field"
                title="Select work entry status"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingEntry ? "Update" : "Create"}
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
