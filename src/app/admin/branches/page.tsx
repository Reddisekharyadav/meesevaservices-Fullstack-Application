"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { Branch } from "@/types";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
  });

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        city: branch.city,
        address: branch.address || "",
      });
    } else {
      setEditingBranch(null);
      setFormData({ name: "", city: "", address: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingBranch
        ? `/api/branches/${editingBranch.id}`
        : "/api/branches";
      const method = editingBranch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchBranches();
      } else {
        alert(data.error || "Failed to save branch");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchBranches();
      } else {
        alert(data.error || "Failed to delete branch");
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
        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          + Add Branch
        </button>
      </div>

      <div className="card">
        {branches.length === 0 ? (
          <p className="text-gray-500">No branches yet. Create your first branch!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">City</th>
                  <th className="table-header">Address</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="table-cell font-medium">{branch.name}</td>
                    <td className="table-cell">{branch.city}</td>
                    <td className="table-cell">{branch.address || "-"}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(branch)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
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
        title={editingBranch ? "Edit Branch" : "Add Branch"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              placeholder="Enter branch name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="Enter city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              placeholder="Enter address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="input-field"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingBranch ? "Update" : "Create"}
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
