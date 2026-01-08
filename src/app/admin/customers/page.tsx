"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { Customer, Branch } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    address: "",
    branchId: "",
  });

  const fetchData = async () => {
    try {
      const [custRes, branchRes] = await Promise.all([
        fetch(`/api/customers${searchTerm ? `?search=${searchTerm}` : ""}`),
        fetch("/api/branches"),
      ]);

      const custData = await custRes.json();
      const branchData = await branchRes.json();

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
  }, [searchTerm]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        password: "",
        address: (customer as any).address || "",
        branchId: customer.branchId.toString(),
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: "",
        phone: "",
        password: "",
        address: "",
        branchId: branches[0]?.id.toString() || "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        branchId: parseInt(formData.branchId),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to save customer");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this customer?")) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete customer");
      }
    } catch (error) {
      alert("An error occurred");
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          + Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <label htmlFor="search-input" className="sr-only">
          Search customers
        </label>
        <input
          id="search-input"
          type="text"
          placeholder="Search by name, phone, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          aria-label="Search customers by name, phone, or username"
        />
      </div>

      <div className="card">
        {customers.length === 0 ? (
          <p className="text-gray-500">
            {searchTerm ? "No customers found." : "No customers yet. Create your first customer!"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Username</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Branch</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="table-cell font-medium">{customer.name}</td>
                    <td className="table-cell">{customer.username}</td>
                    <td className="table-cell">{customer.phone}</td>
                    <td className="table-cell">{customer.branchName || "-"}</td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          customer.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Deactivate
                        </button>
                      </div>
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
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="input-field"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingCustomer && "(leave blank to keep current)"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="input-field"
              placeholder="Enter password"
              required={!editingCustomer}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="input-field"
              placeholder="Enter address"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={formData.branchId}
              onChange={(e) =>
                setFormData({ ...formData, branchId: e.target.value })
              }
              className="input-field"
              required
              aria-label="Select branch"
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingCustomer ? "Update" : "Create"}
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
