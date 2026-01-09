"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  label?: string;
}

export default function FileUpload({
  onUpload,
  accept = ".pdf,.jpg,.jpeg,.png,.gif,.webp",
  label = "Upload Document or Photo",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragActive
          ? "border-primary-500 bg-primary-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        title={label}
        aria-label={label}
      />

      {uploading ? (
        <div className="text-gray-600">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p>Uploading...</p>
        </div>
      ) : (
        <>
          <div className="text-4xl mb-2">📄📷</div>
          <p className="text-gray-600 mb-2">
            Drag and drop a file here, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-xs text-gray-400 mt-1">
            Supported: PDF, JPG, PNG, GIF, WebP
          </p>
        </>
      )}
    </div>
  );
}
