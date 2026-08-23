import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { apiFetch } from '../api/client';
import '../styles/study.css';

export default function StudyMode() {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('docId');

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  // Initialize or fetch study session
  const initializeStudyMode = async () => {
    if (!docId) {
      setError("No document selected. Please select a document from the uploads page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/ai/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, detail_level: "standard" })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw { response: { data, status: response.status } };
      }
      
      setSession(data);
      if (['Queued', 'Generating'].includes(data.status)) {
        startPolling(data.session_id);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start study session.");
      setLoading(false);
    }
  };

  const pollStatus = async (sessionId) => {
    try {
      const response = await apiFetch(`/api/ai/study/${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw { response: { data, status: response.status } };
      }
      
      setSession(data);

      if (['Completed', 'Failed'].includes(data.status)) {
        stopPolling();
      }
    } catch (err) {
      console.error("Polling error:", err);
      // Don't stop polling on transient network errors, but stop if 404/403
      if (err.response?.status === 404 || err.response?.status === 403) {
        stopPolling();
        setError(err.response?.data?.detail || "Session lost.");
      }
    }
  };

  const startPolling = (sessionId) => {
    stopPolling(); // Clear any existing
    pollingRef.current = setInterval(() => {
      pollStatus(sessionId);
    }, 3000); // Poll every 3 seconds
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setLoading(false);
  };

  useEffect(() => {
    initializeStudyMode();
    return () => stopPolling();
    // eslint-disable-next-line
  }, [docId]);

  return (
    <div className="study-app">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/uploads" className="back-btn" title="Back to uploads">
            <ChevronLeft size={16} stroke="#374151" strokeWidth={1.8} />
          </Link>
          <div className="doc-title-wrap">
            <div className="doc-title">Study Mode</div>
            <div className="doc-meta-sm">
              <span>{session?.status === 'Completed' ? 'Generated' : session?.status || 'Ready'}</span>
            </div>
          </div>
        </div>
        <div className="topbar-right">
          <Button variant="secondary" onClick={initializeStudyMode} disabled={loading || session?.status === 'Generating'}>
            <RefreshCw size={15} stroke="#111827" strokeWidth={1.9} className={loading ? 'spinning' : ''} />
            <span className="lbltext">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="workspace" style={{ padding: '24px', overflowY: 'auto' }}>
        {error ? (
          <div className="error-state" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#ef4444' }}>Generation Failed</h3>
            <p>{error}</p>
            <Button onClick={initializeStudyMode} style={{ marginTop: '16px' }}>Try Again</Button>
          </div>
        ) : !session ? (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
            <p>Initializing AI Study Session...</p>
          </div>
        ) : ['Queued', 'Generating'].includes(session.status) ? (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
            <h3>AI is reading your document...</h3>
            <p style={{ color: 'var(--text-muted)' }}>This usually takes about 10-30 seconds depending on document length.</p>
          </div>
        ) : session.status === 'Failed' ? (
          <div className="error-state" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#ef4444' }}>Generation Failed</h3>
            <p>{session.error?.message || 'An unknown error occurred.'}</p>
            <Button onClick={initializeStudyMode} style={{ marginTop: '16px' }}>Try Again</Button>
          </div>
        ) : session.status === 'Completed' && session.result ? (
          <div className="study-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {session.cached && (
              <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '6px', fontSize: '14px' }}>
                Retrieved instantly from cache.
              </div>
            )}
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Summary</h2>
              <p style={{ lineHeight: '1.6', fontSize: '16px', color: '#374151' }}>{session.result.summary}</p>
            </section>
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Key Points</h2>
              <ul style={{ paddingLeft: '24px' }}>
                {session.result.key_points.map((point, i) => (
                  <li key={i} style={{ marginBottom: '12px', lineHeight: '1.6', color: '#374151' }}>{point}</li>
                ))}
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Important Concepts</h2>
              <ul style={{ paddingLeft: '24px' }}>
                {session.result.important_concepts.map((concept, i) => (
                  <li key={i} style={{ marginBottom: '12px', lineHeight: '1.6', color: '#374151' }}>{concept}</li>
                ))}
              </ul>
            </section>
            
            {Object.keys(session.result.definitions || {}).length > 0 && (
              <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Glossary</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {Object.entries(session.result.definitions).map(([term, def], i) => (
                    <div key={i} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <strong style={{ display: 'block', marginBottom: '8px', color: '#111827' }}>{term}</strong>
                      <span style={{ color: '#4b5563' }}>{def}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Revision Notes</h2>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#374151' }}>
                {session.result.revision_notes}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
