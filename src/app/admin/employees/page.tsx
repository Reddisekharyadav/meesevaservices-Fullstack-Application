"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { Employee, Branch } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as "superAdmin" | "branchAdmin" | "employee",
    branchId: "",
  });

  const fetchData = async () => {
    try {
      const [empRes, branchRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/branches"),
      ]);

      const empData = await empRes.json();
      const branchData = await branchRes.json();

      if (empData.success) setEmployees(empData.data);
      if (branchData.success) setBranches(branchData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email || "",
        password: "",
        role: employee.role,
        branchId: employee.branchId?.toString() || "",
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        branchId: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingEmployee
        ? `/api/employees/${editingEmployee.id}`
        : "/api/employees";
      const method = editingEmployee ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        branchId: formData.branchId ? parseInt(formData.branchId) : null,
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
        alert(data.error || "Failed to save employee");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this employee? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete employee");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-700",
      branch_admin: "bg-blue-100 text-blue-700",
      employee: "bg-gray-100 text-gray-700",
    };
    return badges[role] || badges.employee;
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
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          + Add Employee
        </button>
      </div>

      <div className="card">
        {employees.length === 0 ? (
          <p className="text-gray-500">No employees yet. Create your first employee!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Branch</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="table-cell font-medium">{emp.name}</td>
                    <td className="table-cell">{emp.phone}</td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(
                          emp.role
                        )}`}
                      >
                        {emp.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="table-cell">{emp.branchName || "-"}</td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          emp.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(emp)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
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
        title={editingEmployee ? "Edit Employee" : "Add Employee"}
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
              placeholder="Enter employee name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="input-field"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingEmployee && "(leave blank to keep current)"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="input-field"
              placeholder="Enter password"
              required={!editingEmployee}
            />
          </div>

          <div>
            <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role-select"
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as typeof formData.role,
                })
              }
              className="input-field"
            >
              <option value="employee">Employee</option>
              <option value="branchAdmin">Branch Admin</option>
              <option value="superAdmin">Super Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              id="branch-select"
              value={formData.branchId}
              onChange={(e) =>
                setFormData({ ...formData, branchId: e.target.value })
              }
              className="input-field"
            >
              <option value="">No Branch (Super Admin)</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingEmployee ? "Update" : "Create"}
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
