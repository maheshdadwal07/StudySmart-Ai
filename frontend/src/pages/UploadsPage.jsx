import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Play, BookOpen, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import ConfirmModal from '../components/common/ConfirmModal';
import '../styles/dashboard.css';

export default function UploadsPage() {
  const [documents, setDocuments] = useState([]);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const res = await apiFetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'Processing');
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

  const { status, errorMessage, fileName, uploadFile } = useDocumentUpload(fetchDocuments);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = null; // reset so same file can be chosen again
    await uploadFile(file);
  };

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
      const res = await apiFetch(`/api/documents/${documentToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocuments();
        setActionMessage({ text: 'Document deleted successfully.', type: 'success' });
        setTimeout(() => setActionMessage({ text: '', type: '' }), 3000);
      } else {
        setActionMessage({ text: 'Unable to delete document. Please try again.', type: 'error' });
        setTimeout(() => setActionMessage({ text: '', type: '' }), 3000);
      }
    } catch (error) {
      console.error(error);
      setActionMessage({ text: 'Unable to delete document. Please try again.', type: 'error' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 3000);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleProcess = async (id) => {
    try {
      setDocuments(docs => docs.map(d => d._id === id ? { ...d, status: 'Processing' } : d));
      const res = await apiFetch(`/api/documents/${id}/process`, { method: 'POST' });
      if (res.ok) {
        await fetchDocuments();
      } else {
        await fetchDocuments();
        const err = await res.json();
        let errMsg = 'Document processing failed. Please try again.';
        if (res.status === 409) errMsg = 'This document is already being processed.';
        else if (res.status === 404) errMsg = 'Document not found.';
        else if (res.status === 401 || res.status === 403) errMsg = "You're not authorized to process this document.";
        
        setActionMessage({ text: errMsg, type: 'error' });
        setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
      }
    } catch (error) {
      console.error(error);
      await fetchDocuments();
      setActionMessage({ text: 'Document processing failed. Please try again.', type: 'error' });
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    }
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf,.docx,.doc" 
        onChange={handleFileChange} 
      />
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Uploads</h1>
          <p>Manage your uploaded documents and study materials.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleUploadClick} 
            disabled={status === 'uploading'}
          >
            <Upload size={16} />
            {status === 'uploading' ? 'Uploading...' : 'Upload Document'}
          </button>
          
          {status === 'uploading' && <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Uploading {fileName}...</div>}
          {status === 'success' && <div style={{ fontSize: '12.5px', color: '#16A34A', fontWeight: 500 }}>{errorMessage || 'Upload complete'}</div>}
          {status === 'error' && <div style={{ fontSize: '12.5px', color: '#EF4444', maxWidth: '250px', textAlign: 'right' }}>{errorMessage}</div>}
          {actionMessage.text && <div style={{ fontSize: '12.5px', color: actionMessage.type === 'success' ? '#16A34A' : '#EF4444', fontWeight: 500 }}>{actionMessage.text}</div>}
        </div>
      </div>

      <div className="panel">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>File Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date Uploaded</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                documents.map((item) => {
                  const bytes = item.file_size_bytes || 0;
                  const mb = (bytes / (1024 * 1024)).toFixed(1);
                  const sizeStr = mb > 0 ? `${mb} MB` : `${Math.round(bytes / 1024)} KB`;
                  const dateStr = new Date(item.created_at).toLocaleDateString();
                  
                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,70,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={14} color="#4F46E5" />
                        </div>
                        {item.filename}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{sizeStr}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                          background: item.status === 'Processed' ? 'rgba(34,197,94,0.1)' : item.status === 'Processing' ? 'rgba(245,158,11,0.1)' : item.status === 'Failed' ? 'rgba(239,68,68,0.1)' : 'rgba(79,70,229,0.1)',
                          color: item.status === 'Processed' ? '#16A34A' : item.status === 'Processing' ? '#F59E0B' : item.status === 'Failed' ? '#EF4444' : '#4F46E5'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{dateStr}</td>
                      <td style={{ padding: '16px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {item.status === 'Processed' && (
                          <>
                            <button onClick={() => navigate(`/study-mode?document_id=${item._id}`)} title="Study Now" aria-label="Study Now" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}>
                              <BookOpen size={16} /> Study
                            </button>
                            <button onClick={() => navigate(`/question-mode?document_id=${item._id}`)} title="Generate Quiz" aria-label="Generate Quiz" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}>
                              <HelpCircle size={16} /> Quiz
                            </button>
                          </>
                        )}
                        {(item.status === 'Pending' || item.status === 'Failed') && (
                          <button onClick={() => handleProcess(item._id)} title={item.status === 'Failed' ? "Retry Processing" : "Process Document"} aria-label={item.status === 'Failed' ? "Retry Processing" : "Process Document"} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.status === 'Failed' ? '#F59E0B' : '#4F46E5' }}>
                            <Play size={16} />
                          </button>
                        )}
                        {item.status === 'Processing' && (
                          <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 500, marginRight: 8, display: 'flex', alignItems: 'center' }}>
                            Processing...
                          </span>
                        )}
                        <button onClick={() => confirmDelete(item._id)} title="Delete Document" aria-label="Delete Document" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                          <Trash2 size={16} />
                        </button>
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
    </>
  );
}
