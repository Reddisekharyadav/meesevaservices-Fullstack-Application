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
      let url = "/api/documents";
      if (filterCustomerId) {
        url += `?customerId=${filterCustomerId}`;
      }

      const [docsRes, custRes] = await Promise.all([
        fetch(url),
        fetch("/api/customers"),
      ]);

      const docsData = await docsRes.json();
      const custData = await custRes.json();

      if (docsData.success) setDocuments(docsData.data);
      if (custData.success) setCustomers(custData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCustomerId]);

  const handleUpload = async (file: File) => {
    if (!selectedCustomerId) {
      alert("Please select a customer first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("customerId", selectedCustomerId);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchData();
        alert("Document uploaded successfully!");
      } else {
        alert(data.error || "Failed to upload document");
      }
    } catch (error) {
      alert("An error occurred during upload");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete document");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const data = await res.json();

      if (data.success) {
        window.open(data.data.downloadUrl, "_blank");
      }
    } catch (error) {
      alert("Failed to get download URL");
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + Upload Document
        </button>
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Customer
        </label>
        <select
          value={filterCustomerId}
          onChange={(e) => setFilterCustomerId(e.target.value)}
          className="input-field max-w-md"
          aria-label="Filter by Customer"
        >
          <option value="">All Customers</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.phone})
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">File Name</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Size</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="table-cell font-medium">
                      <div className="flex items-center gap-2">
                        <span>📄</span>
                        {doc.originalName}
                      </div>
                    </td>
                    <td className="table-cell">{doc.customerName}</td>
                    <td className="table-cell">{formatFileSize(doc.fileSize)}</td>
                    <td className="table-cell">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
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

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="input-field"
              required
              aria-label="Select Customer"
            >
              <option value="">Choose a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phone})
                </option>
              ))}
            </select>
          </div>

          {selectedCustomerId && (
            <FileUpload 
              onUpload={handleUpload} 
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" 
              label="Upload Document or Photo (max 10MB)" 
            />
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
