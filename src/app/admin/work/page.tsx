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
  const [selectedDate, setSelectedDate] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [formData, setFormData] = useState({
    customerId: "",
    description: "",
    amount: "",
    branchId: "",
  });

  const fetchData = async () => {
    try {
      // Build query parameters
      let workEntriesUrl = '/api/work-entries';
      const params = new URLSearchParams();
      
      if (selectedDate) {
        params.append('date', selectedDate);
      } else if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }
      
      if (params.toString()) {
        workEntriesUrl += '?' + params.toString();
      }
      
      const [entriesRes, custRes, branchRes] = await Promise.all([
        fetch(workEntriesUrl),
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
  }, [selectedDate, dateRange]);

  const handleOpenModal = () => {
    setFormData({
      customerId: "",
      description: "",
      amount: "",
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
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specific Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDateRange({ startDate: "", endDate: "" }); // Clear range when single date is selected
              }}
              className="input-field"
              placeholder="Select single date"
            />
          </div>
          <div>
            <label htmlFor="startDateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="startDateRange"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange({ ...dateRange, startDate: e.target.value });
                setSelectedDate(""); // Clear single date when range is used
              }}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange({ ...dateRange, startDate: e.target.value });
                setSelectedDate(""); // Clear single date when range is used
              }}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange({ ...dateRange, endDate: e.target.value });
                setSelectedDate(""); // Clear single date when range is used
              }}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedDate("");
                setDateRange({ startDate: "", endDate: "" });
              }}
              className="btn-secondary"
            >
              Show All
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="btn-secondary"
            >
              Today
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {entries.length} work entries
          </span>
          <div className="text-lg font-semibold text-gray-900">
            Total: ₹{totalAmount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📋</span>
            <p className="text-gray-500 mb-2">
              No work entries found for the selected period.
            </p>
            <p className="text-sm text-gray-400">
              Try adjusting your date filter or click "Show All" to see all entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Employee</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="table-cell font-medium">
                      {entry.customerName}
                    </td>
                    <td className="table-cell text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        {(entry as any).employeeName || 'Unknown'}
                      </span>
                    </td>
                    <td className="table-cell">{entry.description}</td>
                    <td className="table-cell">₹{entry.amount.toLocaleString()}</td>
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
                    <td className="table-cell text-sm text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
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
                  {branch.name}
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
