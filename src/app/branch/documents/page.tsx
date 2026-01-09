"use client";

import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import { Document, Customer } from "@/types";

// Extend Document type to include description property
interface DocumentWithDescription extends Document {
  description?: string;
}

export default function BranchDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentWithDescription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [uploadCustomerId, setUploadCustomerId] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCustomerId) params.append("customerId", selectedCustomerId);

      const [docsRes, custRes] = await Promise.all([
        fetch(`/api/documents?${params}`),
        fetch("/api/customers"),
      ]);

      const docsData = await docsRes.json();
      const custData = await custRes.json();

      if (docsData.success) setDocuments(docsData.data);
      if (custData.success) setCustomers(custData.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCustomerId]);

  const handleUpload = async (file: File) => {
    if (!uploadCustomerId) {
      alert("Please select a customer first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("customerId", uploadCustomerId);
    if (description) formData.append("description", description);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setDescription("");
        fetchData();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      alert("An error occurred during upload");
    }
  };

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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Delete failed");
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Documents</h1>

      {/* Upload Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Document
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={uploadCustomerId}
              onChange={(e) => setUploadCustomerId(e.target.value)}
              className="input-field"
              aria-label="Select customer for document upload"
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phone})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="e.g., Aadhar Card, PAN Card"
            />
          </div>
        </div>
        <FileUpload 
          onUpload={handleUpload} 
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" 
          label="Upload Document or Photo (max 10MB)"
        />
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="input-field w-full md:w-64"
          aria-label="Filter documents by customer"
        >
          <option value="">All Customers</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Documents List */}
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
                  <th className="table-header">Description</th>
                  <th className="table-header">Uploaded</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="table-cell font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span>
                        {doc.originalName}
                      </div>
                    </td>
                    <td className="table-cell">{doc.customerName}</td>
                    <td className="table-cell">{doc.description || "-"}</td>
                    <td className="table-cell">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleDownload(doc.id, doc.originalName)}
                        className="text-primary-600 hover:text-primary-700 mr-3"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
