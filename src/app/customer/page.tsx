"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";

export default function CustomerDashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalPayments: 0,
    totalWorkEntries: 0,
    pendingWork: 0,
  });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, payRes, workRes] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/payments"),
          fetch("/api/work-entries"),
        ]);

        const docsData = await docsRes.json();
        const payData = await payRes.json();
        const workData = await workRes.json();

        const documents = docsData.success ? docsData.data : [];
        const payments = payData.success ? payData.data : [];
        const workEntries = workData.success ? workData.data : [];

        const pendingWork = workEntries.filter(
          (w: any) => w.status !== "completed"
        ).length;

        setStats({
          totalDocuments: documents.length,
          totalPayments: payments.length,
          totalWorkEntries: workEntries.length,
          pendingWork,
        });

        setRecentDocs(documents.slice(0, 3));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          title="My Documents"
          value={stats.totalDocuments}
          icon="📄"
          color="blue"
        />
        <StatsCard
          title="Payments Made"
          value={stats.totalPayments}
          icon="💳"
          color="green"
        />
        <StatsCard
          title="Work Entries"
          value={stats.totalWorkEntries}
          icon="📝"
          color="purple"
        />
        <StatsCard
          title="Pending Work"
          value={stats.pendingWork}
          icon="⏳"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Documents
            </h2>
            <a
              href="/customer/documents"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All →
            </a>
          </div>
          {recentDocs.length === 0 ? (
            <p className="text-gray-500">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {doc.originalName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <a
              href="/customer/documents"
              className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-medium text-blue-900">View Documents</p>
                  <p className="text-sm text-blue-600">
                    Download your PDFs and certificates
                  </p>
                </div>
              </div>
            </a>
            <a
              href="/customer/payments"
              className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-medium text-green-900">Payment History</p>
                  <p className="text-sm text-green-600">
                    View all your past payments
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
