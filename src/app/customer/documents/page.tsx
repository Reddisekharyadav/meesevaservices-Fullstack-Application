"use client";

import { useEffect, useState } from "react";

interface Document {
  id: number;
  originalName: string;
  description: string;
  createdAt: string;
}

export default function CustomerDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        if (data.success) setDocuments(data.data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleDownload = async (id: number, filename: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();

      if (data.success && data.data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.data.downloadUrl;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Download error:", error);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Documents</h1>

      {documents.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl mb-4 block">📄</span>
          <p className="text-gray-500">
            No documents have been uploaded for you yet.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Documents uploaded by the admin will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card">
              <div className="flex items-start gap-3">
                <span className="text-3xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {doc.originalName}
                  </p>
                  {doc.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {doc.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(doc.id, doc.originalName)}
                className="btn-primary w-full mt-4"
              >
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
