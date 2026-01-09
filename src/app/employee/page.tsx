"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";

export default function EmployeeDashboard() {
  const [stats, setStats] = useState({
    assignedWork: 0,
    completedWork: 0,
    pendingWork: 0,
    documentsUploaded: 0,
  });
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workRes, docsRes] = await Promise.all([
          fetch("/api/work-entries"),
          fetch("/api/documents"),
        ]);

        const workData = await workRes.json();
        const docsData = await docsRes.json();

        const workEntries = workData.success ? workData.data : [];
        const documents = docsData.success ? docsData.data : [];

        const completedWork = workEntries.filter(
          (w: any) => w.status === "completed"
        ).length;
        const pendingWork = workEntries.filter(
          (w: any) => w.status !== "completed"
        );

        setStats({
          assignedWork: workEntries.length,
          completedWork,
          pendingWork: pendingWork.length,
          documentsUploaded: documents.length,
        });

        setPendingTasks(pendingWork.slice(0, 5));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkComplete = async (id: number) => {
    try {
      await fetch(`/api/work-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Assigned Work"
          value={stats.assignedWork}
          icon="📋"
          color="blue"
        />
        <StatsCard
          title="Completed"
          value={stats.completedWork}
          icon="✅"
          color="green"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingWork}
          icon="⏳"
          color="yellow"
        />
        <StatsCard
          title="Documents Uploaded"
          value={stats.documentsUploaded}
          icon="📄"
          color="purple"
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Tasks
        </h2>
        {pendingTasks.length === 0 ? (
          <p className="text-gray-500">No pending tasks. Great job!</p>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{task.description}</p>
                  <p className="text-sm text-gray-500">
                    Customer: {task.customerName} • ₹{task.amount}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkComplete(task.id)}
                  className="btn-primary text-sm"
                >
                  Mark Complete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
