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
    setUserAnswers({});
    setSubmittedAnswers({});

    if (sessionIdParam) {
      await fetchExistingSession(sessionIdParam);
    } else if (docIdParam) {
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
            <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Quiz Settings</h3>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#4b5563' }}>Questions</label>
                  <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#4b5563' }}>Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {uploadError && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{uploadError}</div>}
            
            {appState === 'loading_docs' ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader size={32} className="spinning" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                <FileText size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#374151' }}>No documents available</h3>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>Upload a document to generate a quiz.</p>
                <Button onClick={handleUploadClick}>Upload Document</Button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: '#374151' }}>Select a document</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {documents.filter(d => d.status === 'Processed').map(doc => (
                    <div 
                      key={doc._id} 
                      onClick={() => selectDocument(doc._id)}
                      style={{ 
                        padding: '16px 20px', 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79,70,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} color="#4F46E5" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>{doc.filename}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
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
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
            <p>Initializing AI Quiz Session...</p>
          </div>
        )}

        {/* Generating State */}
        {appState === 'generating' && (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <Loader size={40} className="spinning" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
            <h3>AI is generating your questions...</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>This usually takes about 10-30 seconds.</p>
          </div>
        )}

        {/* Error State */}
        {appState === 'error' && (
          <div className="error-state" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#ef4444', fontSize: '20px' }}>Generation Failed</h3>
            <p style={{ marginTop: '8px', color: '#4b5563' }}>{errorMsg || 'An unknown error occurred.'}</p>
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
              <div style={{ marginBottom: '24px', padding: '12px 16px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px', fontSize: '14px', border: '1px solid #bbf7d0' }}>
                Loaded instantly from previously saved quiz.
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '32px' }}>
              {session.result.questions.map((q, qIndex) => {
                const isSubmitted = submittedAnswers[qIndex];
                const selectedOption = userAnswers[qIndex];
                const isCorrect = selectedOption === q.correct_answer_id;

                return (
                  <div key={qIndex} style={{ padding: '24px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#4b5563' }}>
                        {qIndex + 1}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '20px', lineHeight: '1.5' }}>
                          {q.question_text}
                        </h3>
                        
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                          {q.options.map((opt) => {
                            const isSelected = selectedOption === opt.id;
                            let optStyle = {
                              padding: '12px 16px',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              cursor: isSubmitted ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s ease',
                              backgroundColor: isSelected ? '#f0f4ff' : '#fff',
                              borderColor: isSelected ? '#4f46e5' : '#d1d5db',
                            };

                            if (isSubmitted) {
                              if (opt.id === q.correct_answer_id) {
                                optStyle.backgroundColor = '#f0fdf4';
                                optStyle.borderColor = '#22c55e';
                              } else if (isSelected && opt.id !== q.correct_answer_id) {
                                optStyle.backgroundColor = '#fef2f2';
                                optStyle.borderColor = '#ef4444';
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
                                  borderColor: isSubmitted ? (opt.id === q.correct_answer_id ? '#22c55e' : (isSelected ? '#ef4444' : '#d1d5db')) : (isSelected ? '#4f46e5' : '#d1d5db'),
                                  backgroundColor: isSubmitted ? (opt.id === q.correct_answer_id ? '#22c55e' : (isSelected ? '#ef4444' : 'transparent')) : (isSelected ? '#4f46e5' : 'transparent'),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {(isSelected || (isSubmitted && opt.id === q.correct_answer_id)) && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                                </div>
                                <span style={{ color: '#374151', fontSize: '15px' }}>{opt.text}</span>
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
                          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, color: isCorrect ? '#166534' : '#991b1b' }}>
                              {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                              {isCorrect ? 'Correct!' : 'Incorrect'}
                            </div>
                            <p style={{ color: isCorrect ? '#15803d' : '#b91c1c', fontSize: '14.5px', lineHeight: '1.5' }}>
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
