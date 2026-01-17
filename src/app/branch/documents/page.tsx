"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import FileUpload from "@/components/FileUpload";
import { Document, Customer } from "@/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("");

  const fetchData = async () => {
  try {
    console.log("📄 Fetching documents...");
    setLoading(true);

    let url = "/api/documents";
    if (filterCustomerId) {
      url += `?customerId=${filterCustomerId}`;
    }

    console.log("➡️ Documents URL:", url);

    const docsRes = await fetch(url);
    console.log("📥 Documents response status:", docsRes.status);

    const docsText = await docsRes.text();
    console.log("📦 Raw documents response:", docsText);

    const docsData = JSON.parse(docsText);
    console.log("✅ Parsed documents:", docsData);

    const custRes = await fetch("/api/customers");
    const custData = await custRes.json();

    if (docsData.success) {
      console.log("🧾 Setting documents:", docsData.data);
      setDocuments(docsData.data);
    } else {
      console.error("❌ Documents API error:", docsData.error);
    }

    if (custData.success) setCustomers(custData.data);
  } catch (err) {
    console.error("🔥 Frontend fetch error:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchData();
  }, [filterCustomerId]);

  const handleUpload = async (file: File) => {
    if (!selectedCustomerId) {
      alert("Select a customer first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("customerId", selectedCustomerId);

    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      setIsModalOpen(false);
      setSelectedCustomerId("");
      fetchData();
      alert("Document uploaded");
    } else {
      alert(data.error || "Upload failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;

    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (data.success) fetchData();
    else alert(data.error);
  };

  const handleDownload = async (doc: Document) => {
    const res = await fetch(`/api/documents/${doc.id}`);
    const data = await res.json();

    if (data.success) {
      window.open(data.data.downloadUrl, "_blank");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Upload Document
        </button>
      </div>

      <div className="card mb-6">
        <label className="block mb-1 font-medium">Filter by Customer</label>
        <select
          className="input-field max-w-md"
          value={filterCustomerId}
          onChange={(e) => setFilterCustomerId(e.target.value)}
        >
          <option value="">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone})
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents found</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">File</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Size</th>
                <th className="table-header">Date</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="table-cell">📄 {doc.originalName}</td>
                  <td className="table-cell">{doc.customerName}</td>
                  <td className="table-cell">{formatFileSize(doc.fileSize)}</td>
                  <td className="table-cell">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-cell space-x-3">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="text-primary-600"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Document"
      >
        <select
          className="input-field mb-4"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone})
            </option>
          ))}
        </select>

        {selectedCustomerId && (
          <FileUpload
            onUpload={handleUpload}
            accept=".pdf,.jpg,.png,.jpeg"
            label="Upload file (max 10MB)"
          />
        )}
      </Modal>
    </div>
  );
}
