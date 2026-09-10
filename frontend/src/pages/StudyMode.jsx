import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Loader, AlertCircle, Upload, FileText, BookOpen, Lightbulb, Tag, ClipboardList, Zap } from 'lucide-react';
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

  const isLoading = appState === 'loading_session' || appState === 'generating';
  const loadingTitle = appState === 'loading_session'
    ? 'Initializing AI Study Session...'
    : 'AI is reading your document...';
  const loadingSub = appState === 'loading_session'
    ? 'Setting up your study session.'
    : 'This usually takes 10–30 seconds depending on document length.';

  return (
    <div className="study-app">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".pdf,.docx,.doc" 
        onChange={handleFileChange} 
      />

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/uploads" className="back-btn" title="Back to uploads">
            <ChevronLeft size={16} strokeWidth={2} />
          </Link>
          <div className="doc-title-wrap">
            <div className="doc-title">Study Mode</div>
            {(docIdParam || sessionIdParam) && (
              <div className="doc-meta-sm">
                <span className="status-text">{getStatusText()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="topbar-right">
          {(docIdParam || sessionIdParam) && (
            <Button
              variant="secondary"
              onClick={initializeSession}
              disabled={isLoading}
            >
              <RefreshCw size={14} strokeWidth={2} className={isLoading ? 'spinning' : ''} />
              <span className="lbltext">Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── WORKSPACE ── */}
      <div className="workspace" style={{ overflowY: 'auto' }}>

        {/* ── DOCUMENT SELECTOR ── */}
        {(appState === 'idle' || appState === 'loading_docs' || appState === 'selecting') && (
          <div className="selector-container">
            <div className="selector-header">
              <div>
                <div className="selector-title">Choose a document</div>
                <div className="selector-subtitle">Select a processed document to generate study material.</div>
              </div>
              <Button onClick={handleUploadClick} disabled={uploadStatus === 'uploading'}>
                <Upload size={15} strokeWidth={2} />
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload New'}
              </Button>
            </div>

            {uploadError && <div className="upload-error">{uploadError}</div>}

            {appState === 'loading_docs' ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Loader size={28} className="spinning" style={{ margin: '0 auto 14px', color: 'var(--primary)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading documents...</p>
              </div>
            ) : documents.filter(d => d.status === 'Processed').length === 0 ? (
              <div className="empty-state">
                <FileText size={44} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                <h3>No documents available</h3>
                <p>Upload a PDF or Word document to start studying.</p>
                <Button onClick={handleUploadClick}>Upload Document</Button>
              </div>
            ) : (
              <div className="doc-list">
                {documents.filter(d => d.status === 'Processed').map(doc => (
                  <div
                    key={doc._id}
                    className="doc-card"
                    onClick={() => selectDocument(doc._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && selectDocument(doc._id)}
                  >
                    <div className="doc-card-icon">
                      <FileText size={20} color="var(--primary)" />
                    </div>
                    <div className="doc-card-body">
                      <div className="doc-card-name">{doc.filename}</div>
                      <div className="doc-card-date">{new Date(doc.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOADING STATE (loading_session + generating) ── */}
        {isLoading && (
          <div className="sm-loading">
            <div className="sm-loading-card">
              <div className="sm-loading-icon-wrap">
                <div className="sm-loading-ring" />
                <div className="sm-loading-icon">
                  <BookOpen size={20} color="#fff" strokeWidth={2} />
                </div>
              </div>
              <div className="sm-loading-title">{loadingTitle}</div>
              <div className="sm-loading-sub">{loadingSub}</div>
              <div className="sm-loading-dots">
                <span /><span /><span />
              </div>
              {duplicateWarning && (
                <div className="sm-duplicate-notice">
                  Generation already in progress — please wait for it to complete.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {appState === 'error' && (
          <div className="sm-error">
            <div className="sm-error-card">
              <div className="sm-error-icon">
                <AlertCircle size={26} color="var(--error-text)" strokeWidth={2} />
              </div>
              <div className="sm-error-title">Generation Failed</div>
              <div className="sm-error-msg">{errorMsg || 'An unknown error occurred.'}</div>
              <div className="sm-error-actions">
                <Button variant="secondary" onClick={() => setSearchParams({})}>Go Back</Button>
                <Button onClick={initializeSession}>Try Again</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS STATE — STUDY CONTENT ── */}
        {appState === 'success' && session?.result && (
          <div className="study-content-wrap">

            {session.cached && (
              <div className="cached-banner">
                <Zap size={15} strokeWidth={2} />
                Loaded instantly from a previously saved session.
              </div>
            )}

            {/* Summary */}
            {session.result.summary && (
              <section className="study-section">
                <div className="section-header">
                  <div className="section-icon summary">
                    <BookOpen size={16} color="var(--primary)" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="section-label">Overview</div>
                    <div className="section-title">Summary</div>
                  </div>
                </div>
                <div className="summary-body">{session.result.summary}</div>
              </section>
            )}

            {/* Key Points */}
            {session.result.key_points?.length > 0 && (
              <section className="study-section">
                <div className="section-header">
                  <div className="section-icon keypoints">
                    <Lightbulb size={16} color="var(--accent)" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="section-label">What to remember</div>
                    <div className="section-title">Key Points</div>
                  </div>
                </div>
                <div className="kp-list">
                  {session.result.key_points.map((point, i) => (
                    <div key={i} className="kp-item">
                      <div className="kp-bullet">{i + 1}</div>
                      <div className="kp-text">{point}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Important Concepts */}
            {session.result.important_concepts?.length > 0 && (
              <section className="study-section">
                <div className="section-header">
                  <div className="section-icon concepts">
                    <Tag size={16} color="#F59E0B" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="section-label">Core ideas</div>
                    <div className="section-title">Important Concepts</div>
                  </div>
                </div>
                <div className="concepts-list">
                  {session.result.important_concepts.map((concept, i) => (
                    <div key={i} className="concept-item">
                      <div className="concept-dot" />
                      <div className="concept-text">{concept}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Glossary / Definitions */}
            {session.result.definitions && Object.keys(session.result.definitions).length > 0 && (
              <section className="study-section">
                <div className="section-header">
                  <div className="section-icon glossary">
                    <ClipboardList size={16} color="var(--success)" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="section-label">Terminology</div>
                    <div className="section-title">Glossary</div>
                  </div>
                </div>
                <div className="glossary-list">
                  {Object.entries(session.result.definitions).map(([term, def], i) => (
                    <div key={i} className="glossary-item">
                      <div className="glossary-term">{term}</div>
                      <div className="glossary-def">{def}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Revision Notes */}
            {session.result.revision_notes && (
              <section className="study-section">
                <div className="section-header">
                  <div className="section-icon revision">
                    <ClipboardList size={16} color="#EF4444" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="section-label">Quick reference</div>
                    <div className="section-title">Revision Notes</div>
                  </div>
                </div>
                <div className="revision-body">{session.result.revision_notes}</div>
              </section>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
