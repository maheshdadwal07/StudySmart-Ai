import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Trash2, Play, Eye, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import ConfirmModal from "../components/common/ConfirmModal";
import Button from "../components/common/Button";
import "../styles/dashboard.css";

function RenameModal({ isOpen, currentName, onCancel, onConfirm, isLoading }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(currentName || "");
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card)",
          padding: "24px",
          borderRadius: "12px",
          width: "400px",
          maxWidth: "90%",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>
          Rename Document
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="auth-input"
          style={{ width: "100%", marginBottom: "20px" }}
          disabled={isLoading}
          autoFocus
        />
        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
        >
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(name)}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UploadsPage() {
  const [documents, setDocuments] = useState([]);
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename Modal State
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [documentToRename, setDocumentToRename] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      const res = await apiFetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "Processing");
    let interval;
    if (hasProcessing) {
      interval = setInterval(() => {
        fetchDocuments();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [documents]);

  const { status, errorMessage, fileName, uploadFile } =
    useDocumentUpload(fetchDocuments);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null; // reset so same file can be chosen again
    await uploadFile(file);
  };

  const showMessage = (text, type = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: "", type: "" }), 4000);
  };

  // Delete Flow
  const confirmDelete = (id) => {
    setDocumentToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDocumentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/documents/${documentToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDocuments();
        showMessage("Document deleted successfully.");
      } else {
        showMessage("Unable to delete document. Please try again.", "error");
      }
    } catch (error) {
      console.error(error);
      showMessage("Unable to delete document. Please try again.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Rename Flow
  const confirmRename = (doc) => {
    setDocumentToRename(doc);
    setRenameModalOpen(true);
  };

  const handleCancelRename = () => {
    setRenameModalOpen(false);
    setDocumentToRename(null);
  };

  const handleConfirmRename = async (newName) => {
    if (!documentToRename || !newName.trim()) return;
    setIsRenaming(true);
    try {
      const res = await apiFetch(`/api/documents/${documentToRename._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: newName }),
      });
      if (res.ok) {
        await fetchDocuments();
        showMessage("Document renamed successfully.");
        setRenameModalOpen(false);
        setDocumentToRename(null);
      } else {
        const data = await res.json();
        showMessage(data.detail || "Unable to rename document.", "error");
      }
    } catch (error) {
      console.error(error);
      showMessage("Unable to rename document. Please try again.", "error");
    } finally {
      setIsRenaming(false);
    }
  };

  // Preview Flow
  const handlePreview = async (id) => {
    // Open blank window immediately to bypass popup blockers
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      showMessage("Please allow popups to preview documents.", "error");
      return;
    }

    try {
      const res = await apiFetch(`/api/documents/${id}/preview`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          previewWindow.location.href = data.url;
        } else {
          previewWindow.close();
          showMessage("Preview URL not available.", "error");
        }
      } else {
        previewWindow.close();
        showMessage("Unable to securely preview document.", "error");
      }
    } catch (error) {
      console.error(error);
      previewWindow.close();
      showMessage("Failed to open document preview.", "error");
    }
  };

  const handleProcess = async (id) => {
    try {
      setDocuments((docs) =>
        docs.map((d) => (d._id === id ? { ...d, status: "Processing" } : d)),
      );
      const res = await apiFetch(`/api/documents/${id}/process`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        await fetchDocuments();
        const err = await res.json();
        let errMsg = "Document processing failed. Please try again.";
        if (res.status === 409)
          errMsg = "This document is already being processed.";
        else if (res.status === 404) errMsg = "Document not found.";
        else if (res.status === 401 || res.status === 403)
          errMsg = "You're not authorized to process this document.";

        showMessage(errMsg, "error");
      }
    } catch (error) {
      console.error(error);
      await fetchDocuments();
      showMessage("Document processing failed. Please try again.", "error");
    }
  };

  // Calculate storage usage identical to dashboard logic
  const totalSizeBytes = documents.reduce(
    (acc, doc) => acc + (doc.file_size_bytes || 0),
    0,
  );
  const totalMb = totalSizeBytes / (1024 * 1024);
  const storageUsageStr =
    totalMb >= 1.0
      ? `${totalMb.toFixed(1)} MB`
      : totalSizeBytes > 0
        ? `${Math.round(totalSizeBytes / 1024)} KB`
        : "0 KB";

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".pdf,.docx,.doc"
        onChange={handleFileChange}
      />
      <div className="page-head">
        <div>
          <h1>Documents</h1>
          <p>Manage your uploaded files and storage.</p>
          {!loading && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Storage Used:{" "}
              <span style={{ color: "var(--text)" }}>{storageUsageStr}</span>
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <button
            className="btn btn-primary"
            onClick={handleUploadClick}
            disabled={status === "uploading"}
          >
            <Upload size={16} />
            {status === "uploading" ? "Uploading..." : "Upload Document"}
          </button>

          {status === "uploading" && (
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
              Uploading {fileName}...
            </div>
          )}
          {status === "success" && (
            <div
              style={{
                fontSize: "12.5px",
                color: "var(--success-text)",
                fontWeight: 500,
              }}
            >
              {errorMessage || "Upload complete"}
            </div>
          )}
          {status === "error" && (
            <div
              style={{
                fontSize: "12.5px",
                color: "var(--error-text)",
                maxWidth: "250px",
                textAlign: "right",
              }}
            >
              {errorMessage}
            </div>
          )}
          {actionMessage.text && (
            <div
              style={{
                fontSize: "12.5px",
                color:
                  actionMessage.type === "success"
                    ? "var(--success-text)"
                    : "var(--error-text)",
                fontWeight: 500,
              }}
            >
              {actionMessage.text}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div style={{ overflowX: "auto" }}>
          <table
            className="uploads-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: 13.5,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>
                  File Name
                </th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Size</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>
                  Status
                </th>
                <th
                  className="uploads-table-date"
                  style={{ padding: "12px 16px", fontWeight: 600 }}
                >
                  Date Uploaded
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontWeight: 600,
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "60px 40px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ marginBottom: "16px" }}>
                      <FileText
                        size={48}
                        color="var(--text-muted)"
                        style={{ margin: "0 auto" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "var(--text)",
                        fontWeight: 500,
                        marginBottom: "8px",
                      }}
                    >
                      No documents uploaded yet.
                    </div>
                    <p style={{ marginBottom: "24px", fontSize: "14px" }}>
                      Upload your first document to start generating study
                      materials.
                    </p>
                    <Button onClick={handleUploadClick} variant="primary">
                      <Upload size={16} /> Upload Document
                    </Button>
                  </td>
                </tr>
              ) : (
                documents.map((item) => {
                  const bytes = item.file_size_bytes || 0;
                  const mb = (bytes / (1024 * 1024)).toFixed(1);
                  const sizeStr =
                    mb >= 1.0 ? `${mb} MB` : `${Math.round(bytes / 1024)} KB`;
                  const dateStr = new Date(item.created_at).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "short", day: "numeric" },
                  );

                  return (
                    <tr
                      key={item._id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td
                        className="uploads-table-filename"
                        style={{
                          padding: "16px",
                          fontWeight: 500,
                          color: "var(--text)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: "rgba(79,70,229,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flex: "0 0 auto",
                            }}
                          >
                            <FileText size={14} color="var(--primary)" />
                          </div>
                          <span
                            style={{ minWidth: 0, overflowWrap: "anywhere" }}
                          >
                            {item.filename}
                          </span>
                        </div>
                      </td>
                      <td
                        className="uploads-table-size"
                        style={{ padding: "16px", color: "var(--text-muted)" }}
                      >
                        {sizeStr}
                      </td>
                      <td
                        className="uploads-table-status"
                        style={{ padding: "16px" }}
                      >
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background:
                              item.status === "Processed"
                                ? "var(--success-bg)"
                                : item.status === "Processing"
                                  ? "var(--warning-bg)"
                                  : item.status === "Failed"
                                    ? "var(--error-bg)"
                                    : "var(--info-bg)",
                            color:
                              item.status === "Processed"
                                ? "var(--success-text)"
                                : item.status === "Processing"
                                  ? "var(--warning-text)"
                                  : item.status === "Failed"
                                    ? "var(--error-text)"
                                    : "var(--info-text)",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td
                        className="uploads-table-date uploads-table-date-cell"
                        style={{ padding: "16px", color: "var(--text-muted)" }}
                      >
                        {dateStr}
                      </td>
                      <td
                        className="uploads-table-actions"
                        style={{
                          padding: "16px",
                          whiteSpace: "nowrap",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 16,
                            justifyContent: "flex-end",
                            alignItems: "center",
                          }}
                        >
                          {item.status === "Processed" && (
                            <button
                              onClick={() => handlePreview(item._id)}
                              title="Preview Document"
                              aria-label="Preview Document"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          {(item.status === "Pending" ||
                            item.status === "Failed") && (
                            <button
                              onClick={() => handleProcess(item._id)}
                              title={
                                item.status === "Failed"
                                  ? "Retry Processing"
                                  : "Process Document"
                              }
                              aria-label={
                                item.status === "Failed"
                                  ? "Retry Processing"
                                  : "Process Document"
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color:
                                  item.status === "Failed"
                                    ? "var(--warning-text)"
                                    : "var(--primary)",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Play size={18} />
                            </button>
                          )}
                          {item.status === "Processing" && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--warning-text)",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              Processing...
                            </span>
                          )}
                          <button
                            onClick={() => confirmRename(item)}
                            title="Rename Document"
                            aria-label="Rename Document"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => confirmDelete(item._id)}
                            title="Delete Document"
                            aria-label="Delete Document"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--error-text)",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Document?"
        message="This will permanently remove this document and its stored file. This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      <RenameModal
        isOpen={renameModalOpen}
        currentName={documentToRename?.filename}
        onCancel={handleCancelRename}
        onConfirm={handleConfirmRename}
        isLoading={isRenaming}
      />
    </>
  );
}
