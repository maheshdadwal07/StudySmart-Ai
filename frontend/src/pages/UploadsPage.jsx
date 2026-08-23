import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, FileText, FileSpreadsheet, Trash2, Play } from 'lucide-react';
import { apiFetch } from '../api/client';
import '../styles/dashboard.css';

export default function UploadsPage() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      const res = await apiFetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    e.target.value = null;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchDocuments();
      } else {
        const err = await res.json();
        alert('Upload failed: ' + (err.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocuments();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleProcess = async (id) => {
    try {
      // Optimistic update
      setDocuments(docs => docs.map(d => d.id === id ? { ...d, status: 'Processing' } : d));
      const res = await apiFetch(`/api/documents/${id}/process`, { method: 'POST' });
      if (res.ok) {
        await fetchDocuments();
      } else {
        await fetchDocuments(); // revert on fail
        alert('Failed to process document');
      }
    } catch (error) {
      console.error(error);
      await fetchDocuments();
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
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Uploads</h1>
          <p>Manage your uploaded documents and study materials.</p>
        </div>
        <button className="btn btn-primary" onClick={handleUploadClick} disabled={isUploading}>
          <Upload size={16} />
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
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
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
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
                          background: item.status === 'Processed' ? 'rgba(34,197,94,0.1)' : item.status === 'Processing' ? 'rgba(245,158,11,0.1)' : 'rgba(79,70,229,0.1)',
                          color: item.status === 'Processed' ? '#16A34A' : item.status === 'Processing' ? '#F59E0B' : '#4F46E5'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{dateStr}</td>
                      <td style={{ padding: '16px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {item.status === 'Pending' && (
                          <button onClick={() => handleProcess(item.id)} title="Process Document" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}>
                            <Play size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(item.id)} title="Delete Document" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
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
    </>
  );
}
