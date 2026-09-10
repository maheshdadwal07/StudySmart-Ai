import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Loader, AlertCircle, Upload, FileText } from 'lucide-react';
import Button from '../components/common/Button';
import { apiFetch } from '../api/client';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import '../styles/study.css';

export default function StudyMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const docIdParam = searchParams.get('docId');
  const sessionIdParam = searchParams.get('sessionId');

  // explicit states: idle, loading_docs, selecting, loading_session, generating, success, error
  const [appState, setAppState] = useState('idle');
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  
  // Document selector state
  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  // Upload Hook
  const fetchDocuments = async () => {
    try {
      setAppState('loading_docs');
      const res = await apiFetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.items || []);
        setAppState('selecting');
      } else {
        throw new Error("Failed to load documents");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to load your documents.");
      setAppState('error');
    }
  };

  const { status: uploadStatus, errorMessage: uploadError, uploadFile } = useDocumentUpload(fetchDocuments);

  useEffect(() => {
    if (docIdParam || sessionIdParam) {
      initializeSession();
    } else {
      fetchDocuments();
    }
    return () => stopPolling();
    // eslint-disable-next-line
  }, [docIdParam, sessionIdParam]);

  const initializeSession = async () => {
    setAppState('loading_session');
    setErrorMsg(null);
    setDuplicateWarning(false);

    if (sessionIdParam) {
      // Reopen specific session
      await fetchExistingSession(sessionIdParam);
    } else if (docIdParam) {
      // 1. Check for active session first
      try {
        const activeRes = await apiFetch(`/api/ai/study/active?document_id=${docIdParam}`);
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          if (activeData.session_id) {
             setSession(activeData);
             setAppState('generating');
             startPolling(activeData.session_id);
             return; // Stop here, do not create a new one
          }
        }
      } catch (err) {
        // ignore and proceed to POST
      }

      // 2. Create new session or load cached one
      try {
        const response = await apiFetch('/api/ai/study', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_id: docIdParam, detail_level: "standard" })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || "Failed to start study session.");
        }
        
        if (data.already_active) {
           setDuplicateWarning(true);
        }

        if (data.status === 'Queued' || data.status === 'Generating') {
          setSession(data);
          setAppState('generating');
          startPolling(data.session_id);
        } else if (data.status === 'Completed') {
          await fetchExistingSession(data.session_id);
        } else if (data.status === 'Failed') {
          throw new Error("Previous generation attempt failed.");
        }
      } catch (err) {
        setErrorMsg(err.message || "An error occurred.");
        setAppState('error');
      }
    }
  };

  const fetchExistingSession = async (sessionId) => {
    try {
      const response = await apiFetch(`/api/ai/study/${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to load session.");
      }
      
      setSession(data);
      if (data.status === 'Completed') {
        setAppState('success');
      } else if (data.status === 'Failed') {
        setErrorMsg(data.error?.message || "Generation failed.");
        setAppState('error');
      } else {
        setAppState('generating');
        startPolling(sessionId);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to load session.");
      setAppState('error');
    }
  };

  const pollStatus = async (sessionId) => {
    try {
      const response = await apiFetch(`/api/ai/study/${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Polling failed.");
      }
      
      setSession(data);

      if (data.status === 'Completed') {
        stopPolling();
        setAppState('success');
      } else if (data.status === 'Failed') {
        stopPolling();
        setErrorMsg(data.error?.message || "Generation failed.");
        setAppState('error');
      }
    } catch (err) {
      console.error("Polling error:", err);
      // Stop polling on 404/403 or persistent errors
      if (err.message.includes('not found') || err.message.includes('authorized')) {
        stopPolling();
        setErrorMsg(err.message || "Session lost.");
        setAppState('error');
      }
    }
  };

  const startPolling = (sessionId) => {
    stopPolling();
    pollingRef.current = setInterval(() => {
      pollStatus(sessionId);
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = null;
    await uploadFile(file);
  };

  const selectDocument = (id) => {
    setSearchParams({ docId: id });
  };

  const getStatusText = () => {
    if (appState === 'generating' || appState === 'loading_session') {
      return session?.status === 'Generating' ? 'Reading document...' : 'Initializing AI...';
    }
    if (appState === 'success') return 'Generated';
    if (appState === 'error') return 'Failed';
    return 'Ready';
  };

  return (
    <div className="study-app">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf,.docx,.doc" 
        onChange={handleFileChange} 
      />

      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/uploads" className="back-btn" title="Back to uploads">
            <ChevronLeft size={16} stroke="#374151" strokeWidth={1.8} />
          </Link>
          <div className="doc-title-wrap">
            <div className="doc-title">Study Mode</div>
            {(docIdParam || sessionIdParam) && (
              <div className="doc-meta-sm">
                <span>{getStatusText()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="topbar-right">
          {(docIdParam || sessionIdParam) && (
            <Button variant="secondary" onClick={initializeSession} disabled={appState === 'generating' || appState === 'loading_session'}>
              <RefreshCw size={15} stroke="#111827" strokeWidth={1.9} className={appState === 'generating' ? 'spinning' : ''} />
              <span className="lbltext">Refresh</span>
            </Button>
          )}
        </div>
      </div>

      <div className="workspace" style={{ padding: '24px', overflowY: 'auto' }}>
        
        {/* Selecting Document State */}
        {(appState === 'idle' || appState === 'loading_docs' || appState === 'selecting') && (
          <div style={{ maxWidth: '800px', margin: '0 auto', marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Select a document</h2>
              <Button onClick={handleUploadClick} disabled={uploadStatus === 'uploading'}>
                <Upload size={16} />
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload New'}
              </Button>
            </div>

            {uploadError && <div style={{ color: 'var(--error-text)', marginBottom: '16px', fontSize: '14px' }}>{uploadError}</div>}
            
            {appState === 'loading_docs' ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader size={32} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'var(--surface-muted)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text)' }}>No documents available</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Upload a document to start studying.</p>
                <Button onClick={handleUploadClick}>Upload Document</Button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {documents.filter(d => d.status === 'Processed').map(doc => (
                  <div 
                    key={doc._id} 
                    onClick={() => selectDocument(doc._id)}
                    style={{ 
                      padding: '16px 20px', 
                      backgroundColor: 'var(--card)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,70,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '15px' }}>{doc.filename}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading Session State */}
        {appState === 'loading_session' && (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
            <p>Initializing AI Study Session...</p>
          </div>
        )}

        {/* Generating State */}
        {appState === 'generating' && (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
            <h3>AI is reading your document...</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>This usually takes about 10-30 seconds depending on document length.</p>
            {duplicateWarning && (
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'var(--info-bg)', color: 'var(--primary)', borderRadius: '8px', display: 'inline-block' }}>
                Generation already in progress. Please wait for it to complete.
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {appState === 'error' && (
          <div className="error-state" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <AlertCircle size={48} color="var(--error-text)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--error-text)', fontSize: '20px' }}>Generation Failed</h3>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>{errorMsg || 'An unknown error occurred.'}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={() => setSearchParams({})}>Go Back</Button>
              <Button onClick={initializeSession}>Try Again</Button>
            </div>
          </div>
        )}

        {/* Success State (Material Display) */}
        {appState === 'success' && session?.result && (
          <div className="study-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {session.cached && (
              <div style={{ marginBottom: '24px', padding: '12px 16px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '8px', fontSize: '14px', border: '1px solid var(--success-border)' }}>
                Loaded instantly from previously saved session.
              </div>
            )}
            
            {session.result.summary && (
              <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text)' }}>Summary</h2>
                <p style={{ lineHeight: '1.7', fontSize: '16px', color: 'var(--text)' }}>{session.result.summary}</p>
              </section>
            )}
            
            {session.result.key_points?.length > 0 && (
              <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text)' }}>Key Points</h2>
                <ul style={{ paddingLeft: '24px' }}>
                  {session.result.key_points.map((point, i) => (
                    <li key={i} style={{ marginBottom: '12px', lineHeight: '1.6', color: 'var(--text)', fontSize: '15.5px' }}>{point}</li>
                  ))}
                </ul>
              </section>
            )}

            {session.result.important_concepts?.length > 0 && (
              <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text)' }}>Important Concepts</h2>
                <ul style={{ paddingLeft: '24px' }}>
                  {session.result.important_concepts.map((concept, i) => (
                    <li key={i} style={{ marginBottom: '12px', lineHeight: '1.6', color: 'var(--text)', fontSize: '15.5px' }}>{concept}</li>
                  ))}
                </ul>
              </section>
            )}
            
            {session.result.definitions && Object.keys(session.result.definitions).length > 0 && (
              <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text)' }}>Glossary</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {Object.entries(session.result.definitions).map(([term, def], i) => (
                    <div key={i} style={{ padding: '16px', backgroundColor: 'var(--surface-muted)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text)', fontSize: '15px' }}>{term}</strong>
                      <span style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '14.5px' }}>{def}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {session.result.revision_notes && (
              <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text)' }}>Revision Notes</h2>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: 'var(--text)', padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  {session.result.revision_notes}
                </div>
              </section>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
