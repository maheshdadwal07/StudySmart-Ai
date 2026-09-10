import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Loader, AlertCircle, Upload, FileText, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../components/common/Button';
import { apiFetch } from '../api/client';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import '../styles/question.css';

export default function QuestionMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const docIdParam = searchParams.get('docId');
  const sessionIdParam = searchParams.get('sessionId');

  // Explicit states: idle, loading_docs, selecting, loading_session, generating, success, error
  const [appState, setAppState] = useState('idle');
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  
  // Configuration options
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("mcq");

  // Document selector state
  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  // Quiz interactive state
  // userAnswers: mapping from question index to selected option id
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({}); // mapping from question index to boolean indicating if it was submitted

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
      if (appState === 'idle' || appState === 'selecting') {
        initializeSession();
      }
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
    setUserAnswers({});
    setSubmittedAnswers({});

    if (sessionIdParam) {
      await fetchExistingSession(sessionIdParam);
    } else if (docIdParam) {
      // 1. Check for active session first
      try {
        const activeRes = await apiFetch(`/api/ai/questions/active?document_id=${docIdParam}`);
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
        const response = await apiFetch('/api/ai/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            document_id: docIdParam, 
            question_count: questionCount,
            difficulty: difficulty,
            question_type: questionType
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || "Failed to start quiz session.");
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
      const response = await apiFetch(`/api/ai/questions/${sessionId}`);
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
      const response = await apiFetch(`/api/ai/questions/${sessionId}`);
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

  const handleOptionSelect = (qIndex, optionId) => {
    if (submittedAnswers[qIndex]) return; // prevent changing after submit
    setUserAnswers(prev => ({...prev, [qIndex]: optionId}));
  };

  const handleSubmitAnswer = (qIndex) => {
    if (userAnswers[qIndex]) {
      setSubmittedAnswers(prev => ({...prev, [qIndex]: true}));
    }
  };

  const getStatusText = () => {
    if (appState === 'generating' || appState === 'loading_session') {
      return session?.status === 'Generating' ? 'Crafting questions...' : 'Initializing AI...';
    }
    if (appState === 'success') return 'Quiz Ready';
    if (appState === 'error') return 'Failed';
    return 'Ready';
  };

  return (
    <div className="question-app">
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
            <div className="doc-title">Question Mode</div>
            {(docIdParam || sessionIdParam) && (
              <div className="doc-meta-sm">
                <span>{getStatusText()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="topbar-right">
          {(docIdParam || sessionIdParam) && (
            <Button variant="secondary" onClick={() => {
              setSearchParams({});
              setAppState('selecting');
            }} disabled={appState === 'generating' || appState === 'loading_session'}>
              <span className="lbltext">New Quiz</span>
            </Button>
          )}
        </div>
      </div>

      <div className="workspace" style={{ padding: '24px', overflowY: 'auto' }}>
        
        {/* Selecting Document State */}
        {(appState === 'idle' || appState === 'loading_docs' || appState === 'selecting') && (
          <div style={{ maxWidth: '800px', margin: '0 auto', marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Create a Quiz</h2>
              <Button onClick={handleUploadClick} disabled={uploadStatus === 'uploading'}>
                <Upload size={16} />
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload New'}
              </Button>
            </div>

            {/* Quiz Configuration Panel */}
            <div style={{ padding: '20px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Quiz Settings</h3>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Questions</label>
                  <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
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
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Upload a document to generate a quiz.</p>
                <Button onClick={handleUploadClick}>Upload Document</Button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text)' }}>Select a document</h3>
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
              </div>
            )}
          </div>
        )}

        {/* Loading Session State */}
        {appState === 'loading_session' && (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
            <p>Initializing AI Quiz Session...</p>
          </div>
        )}

        {/* Generating State */}
        {appState === 'generating' && (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
            <h3>AI is generating your questions...</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>This usually takes about 10-30 seconds.</p>
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
              <Button variant="secondary" onClick={() => {
                setSearchParams({});
                setAppState('selecting');
              }}>Go Back</Button>
              <Button onClick={initializeSession}>Try Again</Button>
            </div>
          </div>
        )}

        {/* Success State (Quiz Display) */}
        {appState === 'success' && session?.result?.questions && (
          <div className="quiz-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {session.cached && (
              <div style={{ marginBottom: '24px', padding: '12px 16px', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: '8px', fontSize: '14px', border: '1px solid var(--success-border)' }}>
                Loaded instantly from previously saved quiz.
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '32px' }}>
              {session.result.questions.map((q, qIndex) => {
                const isSubmitted = submittedAnswers[qIndex];
                const selectedOption = userAnswers[qIndex];
                const isCorrect = selectedOption === q.correct_answer_id;

                return (
                  <div key={qIndex} style={{ padding: '24px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        {qIndex + 1}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '20px', lineHeight: '1.5' }}>
                          {q.question_text}
                        </h3>
                        
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                          {q.options.map((opt) => {
                            const isSelected = selectedOption === opt.id;
                            let optStyle = {
                              padding: '12px 16px',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              cursor: isSubmitted ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              backgroundColor: isSelected ? 'var(--info-bg)' : 'var(--card)',
                              borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                              color: 'var(--text)'
                            };

                            if (isSubmitted) {
                              if (opt.id === q.correct_answer_id) {
                                optStyle.backgroundColor = 'var(--success-bg)';
                                optStyle.borderColor = 'var(--success-text)';
                              } else if (isSelected && opt.id !== q.correct_answer_id) {
                                optStyle.backgroundColor = 'var(--error-bg)';
                                optStyle.borderColor = 'var(--error-text)';
                              } else {
                                optStyle.opacity = 0.6;
                              }
                            }

                            return (
                              <div 
                                key={opt.id} 
                                onClick={() => handleOptionSelect(qIndex, opt.id)}
                                style={optStyle}
                              >
                                <div style={{ 
                                  width: '20px', height: '20px', borderRadius: '50%', border: '2px solid',
                                  borderColor: isSubmitted ? (opt.id === q.correct_answer_id ? 'var(--success-text)' : (isSelected ? 'var(--error-text)' : 'var(--border)')) : (isSelected ? 'var(--primary)' : 'var(--border)'),
                                  backgroundColor: isSubmitted ? (opt.id === q.correct_answer_id ? 'var(--success-text)' : (isSelected ? 'var(--error-text)' : 'transparent')) : (isSelected ? 'var(--primary)' : 'transparent'),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {(isSelected || (isSubmitted && opt.id === q.correct_answer_id)) && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                                </div>
                                <span style={{ color: 'inherit', fontSize: '15px' }}>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>

                        {!isSubmitted ? (
                          <Button 
                            onClick={() => handleSubmitAnswer(qIndex)} 
                            disabled={!selectedOption}
                          >
                            Submit Answer
                          </Button>
                        ) : (
                          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', backgroundColor: isCorrect ? 'var(--success-bg)' : 'var(--error-bg)', border: `1px solid ${isCorrect ? 'var(--success-border)' : 'var(--error-border)'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, color: isCorrect ? 'var(--success-text)' : 'var(--error-text)' }}>
                              {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                              {isCorrect ? 'Correct!' : 'Incorrect'}
                            </div>
                            <p style={{ color: isCorrect ? 'var(--success-text)' : 'var(--error-text)', fontSize: '14.5px', lineHeight: '1.5' }}>
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
