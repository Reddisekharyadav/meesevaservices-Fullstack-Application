"use client";

import { useEffect, useState } from "react";
import FileUpload from "@/components/FileUpload";
import { Document, Customer } from "@/types";

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadCustomerId, setUploadCustomerId] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const [docsRes, custRes] = await Promise.all([
        fetch("/api/documents"),
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
  }, []);

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
        setUploadCustomerId("");
        fetchData();
        alert("Document uploaded successfully!");
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      alert("An error occurred during upload");
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Documents</h1>

      {/* Upload Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upload PDF for Customer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Customer
            </label>
            <select
              value={uploadCustomerId}
              onChange={(e) => setUploadCustomerId(e.target.value)}
              className="input-field"
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
              Document Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="e.g., Aadhar Card, Birth Certificate"
            />
          </div>
        </div>
        <FileUpload onUpload={handleUpload} accept=".pdf" maxSize={10} />
      </div>

      {/* Recent Uploads */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Uploads
        </h2>
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 10).map((doc) => (
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
                      Customer: {doc.customerName} •{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-green-600 text-sm font-medium">
                  ✓ Uploaded
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
