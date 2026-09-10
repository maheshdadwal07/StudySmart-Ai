import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Loader, AlertCircle, Upload, FileText, CheckCircle2, XCircle, HelpCircle, Zap } from 'lucide-react';
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

  const isLoading = appState === 'loading_session' || appState === 'generating';
  const loadingTitle = appState === 'loading_session'
    ? 'Initializing AI Quiz Session...'
    : 'AI is generating your questions...';
  const loadingSub = appState === 'loading_session'
    ? 'Setting up your quiz session.'
    : 'This usually takes about 10–30 seconds.';

  // Derive quiz summary stats for the header
  const totalQuestions = session?.result?.questions?.length ?? 0;
  const answeredCount = Object.keys(submittedAnswers).length;
  const correctCount = Object.entries(submittedAnswers).filter(([idx]) => {
    const q = session?.result?.questions?.[idx];
    return q && userAnswers[idx] === q.correct_answer_id;
  }).length;

  return (
    <div className="question-app">
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
            <div className="doc-title">Question Mode</div>
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
              onClick={() => {
                setSearchParams({});
                setAppState('selecting');
              }}
              disabled={isLoading}
            >
              <span className="lbltext">New Quiz</span>
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
                <div className="selector-title">Create a Quiz</div>
                <div className="selector-subtitle">Configure your quiz settings, then select a document.</div>
              </div>
              <Button onClick={handleUploadClick} disabled={uploadStatus === 'uploading'}>
                <Upload size={15} strokeWidth={2} />
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload New'}
              </Button>
            </div>

            {/* Quiz Configuration Panel */}
            <div className="quiz-settings-panel">
              <div className="quiz-settings-title">Quiz Settings</div>
              <div className="quiz-settings-row">
                <div className="quiz-setting-field">
                  <label className="quiz-setting-label" htmlFor="qm-count">Questions</label>
                  <select
                    id="qm-count"
                    className="quiz-setting-select"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
                <div className="quiz-setting-field">
                  <label className="quiz-setting-label" htmlFor="qm-difficulty">Difficulty</label>
                  <select
                    id="qm-difficulty"
                    className="quiz-setting-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
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
                <p>Upload a PDF or Word document to generate a quiz.</p>
                <Button onClick={handleUploadClick}>Upload Document</Button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Select a document
                </div>
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
              </div>
            )}
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {isLoading && (
          <div className="qm-loading">
            <div className="qm-loading-card">
              <div className="qm-loading-icon-wrap">
                <div className="qm-loading-ring" />
                <div className="qm-loading-icon">
                  <HelpCircle size={20} color="#fff" strokeWidth={2} />
                </div>
              </div>
              <div className="qm-loading-title">{loadingTitle}</div>
              <div className="qm-loading-sub">{loadingSub}</div>
              <div className="qm-loading-dots">
                <span /><span /><span />
              </div>
              {duplicateWarning && (
                <div className="qm-duplicate-notice">
                  Generation already in progress — please wait for it to complete.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {appState === 'error' && (
          <div className="qm-error">
            <div className="qm-error-card">
              <div className="qm-error-icon">
                <AlertCircle size={26} color="var(--error-text)" strokeWidth={2} />
              </div>
              <div className="qm-error-title">Generation Failed</div>
              <div className="qm-error-msg">{errorMsg || 'An unknown error occurred.'}</div>
              <div className="qm-error-actions">
                <Button variant="secondary" onClick={() => {
                  setSearchParams({});
                  setAppState('selecting');
                }}>Go Back</Button>
                <Button onClick={initializeSession}>Try Again</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS STATE — QUIZ ── */}
        {appState === 'success' && session?.result?.questions && (
          <div className="quiz-content-wrap">

            {session.cached && (
              <div className="cached-banner">
                <Zap size={15} strokeWidth={2} />
                Loaded instantly from a previously saved quiz.
              </div>
            )}

            {/* Quiz summary header */}
            <div className="quiz-header">
              <div className="quiz-header-left">
                <div className="quiz-title">Quiz</div>
                <div className="quiz-meta">
                  <span className="quiz-meta-chip">{totalQuestions} Questions</span>
                  {answeredCount > 0 && (
                    <span className="quiz-progress-text">
                      {answeredCount}/{totalQuestions} answered · {correctCount} correct
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Question list */}
            <div className="quiz-list">
              {session.result.questions.map((q, qIndex) => {
                const isSubmitted = submittedAnswers[qIndex];
                const selectedOption = userAnswers[qIndex];
                const isCorrect = selectedOption === q.correct_answer_id;

                return (
                  <div key={qIndex} className="quiz-card">
                    <div className="quiz-card-top">
                      <div className="q-num-badge">{qIndex + 1}</div>
                      <div className="q-body">
                        <p className="q-text">{q.question_text}</p>
                      </div>
                    </div>

                    {/* Answer options */}
                    <div className="opt-list">
                      {q.options.map((opt) => {
                        const isSelected = selectedOption === opt.id;
                        const isCorrectOpt = opt.id === q.correct_answer_id;

                        // Build class string
                        let cls = 'opt-item';
                        if (isSubmitted) {
                          cls += ' opt-submitted';
                          if (isCorrectOpt) {
                            cls += ' opt-correct';
                          } else if (isSelected) {
                            cls += ' opt-wrong';
                          } else {
                            cls += ' opt-dimmed';
                          }
                        } else {
                          if (isSelected) cls += ' opt-selected';
                        }

                        // Radio indicator: show dot when selected or correct-after-submit
                        const showDot = isSelected || (isSubmitted && isCorrectOpt);

                        return (
                          <div
                            key={opt.id}
                            className={cls}
                            onClick={() => handleOptionSelect(qIndex, opt.id)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={isSubmitted ? -1 : 0}
                            onKeyDown={e => {
                              if (!isSubmitted && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleOptionSelect(qIndex, opt.id);
                              }
                            }}
                          >
                            <div className="opt-radio">
                              {showDot && <div className="opt-radio-dot" />}
                            </div>
                            <span className="opt-text">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit or feedback */}
                    {!isSubmitted ? (
                      <div className="opt-submit-row">
                        <Button
                          onClick={() => handleSubmitAnswer(qIndex)}
                          disabled={!selectedOption}
                        >
                          Submit Answer
                        </Button>
                      </div>
                    ) : (
                      <div className={`answer-feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
                        <div className="feedback-header">
                          {isCorrect
                            ? <CheckCircle2 size={17} strokeWidth={2} />
                            : <XCircle size={17} strokeWidth={2} />
                          }
                          {isCorrect ? 'Correct!' : 'Incorrect'}
                        </div>
                        <div className="feedback-text">{q.explanation}</div>
                      </div>
                    )}
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
