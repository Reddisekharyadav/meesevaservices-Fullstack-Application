"use client";

import { useEffect, useState } from "react";
import { WorkEntry } from "@/types";

export default function EmployeeWorkPage() {
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/work-entries");
      const data = await res.json();
      if (data.success) setWorkEntries(data.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/work-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to update status");
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

  const filteredEntries = workEntries.filter((entry) => {
    if (filter === "all") return true;
    return entry.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Work</h1>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-full md:w-48"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="text-gray-500">No work entries found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {entry.description}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        entry.status
                      )}`}
                    >
                      {entry.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Customer: {entry.customerName} • Amount: ₹{entry.amount}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {entry.status === "pending" && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(entry.id, "in_progress")
                      }
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Start Work
                    </button>
                  )}
                  {entry.status === "in_progress" && (
                    <button
                      onClick={() => handleUpdateStatus(entry.id, "completed")}
                      className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Mark Complete
                    </button>
                  )}
                  {entry.status === "completed" && (
                    <span className="px-4 py-2 text-sm text-green-600 font-medium">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
