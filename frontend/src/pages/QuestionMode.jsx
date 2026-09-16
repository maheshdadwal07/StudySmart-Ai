import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, UNSAFE_NavigationContext } from 'react-router-dom';
import { ChevronLeft, Loader, AlertCircle, Upload, FileText, CheckCircle2, XCircle, HelpCircle, Zap } from 'lucide-react';
import Button from '../components/common/Button';
import { apiFetch } from '../api/client';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import '../styles/question.css';

// Small inline modal for Question Mode specific actions
function QuizActionModal({ isOpen, title, message, actions }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px", width: "100%", maxWidth: "400px", boxShadow: "var(--shadow-lg)" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>{title}</h3>
        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.5" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
          {actions.map((act, i) => (
            <Button key={i} variant={act.variant || "secondary"} onClick={act.onClick} disabled={act.disabled} style={act.style}>
              {act.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuestionMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const docIdParam = searchParams.get('docId');
  const sessionIdParam = searchParams.get('sessionId');

  const [appState, setAppState] = useState('idle');
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("mcq");

  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  const [userAnswers, setUserAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({}); 

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, pendingLocation: null });

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

  const loadSessionState = (data) => {
    setSession(data);
    if (data.status === 'Completed') {
      const answers = data.user_answers || {};
      setUserAnswers(answers);
      
      if (data.quiz_status === 'submitted') {
        const allSubmitted = {};
        Object.keys(answers).forEach(k => allSubmitted[k] = true);
        setSubmittedAnswers(allSubmitted);
      } else if (data.quiz_status === 'pending') {
         // Keep answers, but they aren't fully submitted
         // For Phase 1, we can leave submittedAnswers empty so user can change them, 
         // or we can mark them submitted if they clicked "Submit Answer" individually before.
         // Based on original logic, "Submit Answer" was local. Let's just restore userAnswers.
         setSubmittedAnswers({});
      }
      setAppState('success');
    } else if (data.status === 'Failed') {
      setErrorMsg(data.error?.message || "Generation failed.");
      setAppState('error');
    } else {
      setAppState('generating');
      startPolling(data.session_id);
    }
  };

  const initializeSession = async () => {
    setAppState('loading_session');
    setErrorMsg(null);
    setDuplicateWarning(false);
    setUserAnswers({});
    setSubmittedAnswers({});

    if (sessionIdParam) {
      try {
        const response = await apiFetch(`/api/ai/questions/${sessionIdParam}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to load session.");
        loadSessionState(data);
      } catch (err) {
        setErrorMsg(err.message || "Failed to load session.");
        setAppState('error');
      }
    } else if (docIdParam) {
      try {
        const activeRes = await apiFetch(`/api/ai/questions/active?document_id=${docIdParam}`);
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          if (activeData.session_id) {
             setSession(activeData);
             setAppState('generating');
             startPolling(activeData.session_id);
             return;
          }
        }
      } catch (err) {}

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
        if (!response.ok) throw new Error(data.detail || "Failed to start quiz session.");
        if (data.already_active) setDuplicateWarning(true);

        if (data.status === 'Queued' || data.status === 'Generating') {
          setSession(data);
          setAppState('generating');
          startPolling(data.session_id);
        } else if (data.status === 'Completed') {
          const res2 = await apiFetch(`/api/ai/questions/${data.session_id}`);
          const d2 = await res2.json();
          loadSessionState(d2);
        } else if (data.status === 'Failed') {
          throw new Error("Previous generation attempt failed.");
        }
      } catch (err) {
        setErrorMsg(err.message || "An error occurred.");
        setAppState('error');
      }
    }
  };

  const pollStatus = async (sessionId) => {
    try {
      const response = await apiFetch(`/api/ai/questions/${sessionId}`);
      
      if (!response.ok) {
        let errDetail = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errDetail = errData.detail || errDetail;
        } catch (e) {}
        
        if (response.status === 404) {
          throw new Error("not found");
        }
        throw new Error(errDetail);
      }
      
      const data = await response.json();
      setSession(data);
      
      if (data.status === 'Completed') {
        stopPolling();
        loadSessionState(data);
      } else if (data.status === 'Failed') {
        stopPolling();
        setErrorMsg(data.error?.message || "Generation failed.");
        setAppState('error');
      }
    } catch (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes('not found') || msg.includes('authorized') || msg.includes('lost')) {
        stopPolling();
        setErrorMsg("Session not found or lost.");
        setAppState('error');
      }
      // If it's a generic network error, we keep polling in case it's a transient blip,
      // but 404s will definitively stop it now.
    }
  };

  const startPolling = (sessionId) => {
    stopPolling();
    pollingRef.current = setInterval(() => pollStatus(sessionId), 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
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
    if (session?.quiz_status === 'submitted') return;
    setUserAnswers(prev => ({...prev, [qIndex]: optionId}));
  };

  // Lifecycle logic
  const isQuizActive = appState === 'success' && session?.quiz_status === 'in_progress';

  // Navigation Guard (React Router)
  const { navigator } = React.useContext(UNSAFE_NavigationContext);
  
  useEffect(() => {
    if (!isQuizActive) return;

    const originalPush = navigator.push;
    navigator.push = (...args) => {
      const targetUrl = typeof args[0] === 'string' ? args[0] : args[0].pathname;
      if (targetUrl && targetUrl !== '/question-mode') {
        setModalState({ isOpen: true, type: 'navigation', pendingLocation: targetUrl });
      } else {
        originalPush(...args);
      }
    };

    return () => {
      navigator.push = originalPush;
    };
  }, [isQuizActive, navigator]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isQuizActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isQuizActive]);

  const closeModals = () => {
    setModalState({ isOpen: false, type: null, pendingLocation: null });
  };

  const execSaveProgress = async (pendingLoc) => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`/api/ai/questions/${session.session_id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_answers: userAnswers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save progress");
      loadSessionState(data);
      if (pendingLoc) {
        navigate(pendingLoc);
      }
      setModalState({ isOpen: false, type: null, pendingLocation: null });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const execSubmitQuiz = async (pendingLoc) => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/ai/questions/${session.session_id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_answers: userAnswers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to submit quiz");
      loadSessionState(data);
      if (pendingLoc) {
        navigate(pendingLoc);
      }
      setModalState({ isOpen: false, type: null, pendingLocation: null });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModal = () => {
    if (!modalState.isOpen) return null;

    if (modalState.type === 'submit') {
      return (
        <QuizActionModal
          isOpen={true}
          title="Submit Quiz?"
          message="Once submitted, your answers will be recorded and the quiz will be marked as completed."
          actions={[
            { label: "Cancel", onClick: closeModals, variant: "ghost", disabled: isSubmitting },
            { label: isSubmitting ? "Submitting..." : "Submit Quiz", onClick: () => execSubmitQuiz(null), variant: "primary", disabled: isSubmitting, style: { backgroundColor: "var(--primary)", color: "#fff" } }
          ]}
        />
      );
    }

    if (modalState.type === 'resume') {
      return (
        <QuizActionModal
          isOpen={true}
          title="Resume Later?"
          message="Your quiz will be saved as pending. You can return later and complete it."
          actions={[
            { label: "Cancel", onClick: closeModals, variant: "ghost", disabled: isSaving },
            { label: isSaving ? "Saving..." : "Resume Later", onClick: () => execSaveProgress(null), variant: "secondary", disabled: isSaving }
          ]}
        />
      );
    }

    if (modalState.type === 'navigation') {
      return (
        <QuizActionModal
          isOpen={true}
          title="Quiz in Progress"
          message="You haven't finished this quiz yet. Submit the quiz or save it to resume later before leaving."
          actions={[
            { label: "Cancel", onClick: closeModals, variant: "ghost", disabled: isSubmitting || isSaving },
            { label: isSaving ? "Saving..." : "Resume Later", onClick: () => execSaveProgress(modalState.pendingLocation), variant: "secondary", disabled: isSubmitting || isSaving },
            { label: isSubmitting ? "Submitting..." : "Submit Quiz", onClick: () => execSubmitQuiz(modalState.pendingLocation), variant: "primary", disabled: isSubmitting || isSaving, style: { backgroundColor: "var(--primary)", color: "#fff" } }
          ]}
        />
      );
    }
    return null;
  };

  const getStatusText = () => {
    if (appState === 'generating' || appState === 'loading_session') {
      return session?.status === 'Generating' ? 'Crafting questions...' : 'Initializing AI...';
    }
    if (appState === 'success') {
      if (session?.quiz_status === 'submitted') return 'Completed';
      if (session?.quiz_status === 'pending') return 'Pending';
      return 'Quiz Ready';
    }
    if (appState === 'error') return 'Failed';
    return 'Ready';
  };

  const isLoading = appState === 'loading_session' || appState === 'generating';
  const loadingTitle = appState === 'loading_session' ? 'Initializing AI Quiz Session...' : 'AI is generating your questions...';
  const loadingSub = appState === 'loading_session' ? 'Setting up your quiz session.' : 'This usually takes about 10–30 seconds.';

  const totalQuestions = session?.result?.questions?.length ?? 0;
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="question-app">
      {renderModal()}
      
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf,.docx,.doc" onChange={handleFileChange} />

      <div className="topbar">
        <div className="topbar-left">
          <Link 
            to="/uploads" 
            className="back-btn" 
            title="Back to uploads"
            onClick={(e) => {
              if (isQuizActive) {
                e.preventDefault();
                navigate('/uploads'); // trigger blocker
              }
            }}
          >
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
                if (isQuizActive) {
                  // Manually block resetting state since this is internal to the page and not caught by router block
                  setModalState({ isOpen: true, type: 'navigation', pendingLocation: '/question-mode' });
                } else {
                  setSearchParams({});
                  setAppState('selecting');
                }
              }}
              disabled={isLoading}
            >
              <span className="lbltext">New Quiz</span>
            </Button>
          )}
        </div>
      </div>

      <div className="workspace" style={{ overflowY: 'auto' }}>
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
            <div className="quiz-settings-panel">
              <div className="quiz-settings-title">Quiz Settings</div>
              <div className="quiz-settings-row">
                <div className="quiz-setting-field">
                  <label className="quiz-setting-label" htmlFor="qm-count">Questions</label>
                  <select id="qm-count" className="quiz-setting-select" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
                <div className="quiz-setting-field">
                  <label className="quiz-setting-label" htmlFor="qm-difficulty">Difficulty</label>
                  <select id="qm-difficulty" className="quiz-setting-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
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
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select a document</div>
                <div className="doc-list">
                  {documents.filter(d => d.status === 'Processed').map(doc => (
                    <div key={doc._id} className="doc-card" onClick={() => selectDocument(doc._id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && selectDocument(doc._id)}>
                      <div className="doc-card-icon"><FileText size={20} color="var(--primary)" /></div>
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

        {isLoading && (
          <div className="qm-loading">
            <div className="qm-loading-card">
              <div className="qm-loading-icon-wrap"><div className="qm-loading-ring" /><div className="qm-loading-icon"><HelpCircle size={20} color="#fff" strokeWidth={2} /></div></div>
              <div className="qm-loading-title">{loadingTitle}</div>
              <div className="qm-loading-sub">{loadingSub}</div>
              <div className="qm-loading-dots"><span /><span /><span /></div>
              {duplicateWarning && <div className="qm-duplicate-notice">Generation already in progress — please wait for it to complete.</div>}
            </div>
          </div>
        )}

        {appState === 'error' && (
          <div className="qm-error">
            <div className="qm-error-card">
              <div className="qm-error-icon"><AlertCircle size={26} color="var(--error-text)" strokeWidth={2} /></div>
              <div className="qm-error-title">Generation Failed</div>
              <div className="qm-error-msg">{errorMsg || 'An unknown error occurred.'}</div>
              <div className="qm-error-actions">
                <Button variant="secondary" onClick={() => { setSearchParams({}); setAppState('selecting'); }}>Go Back</Button>
                <Button onClick={initializeSession}>Try Again</Button>
              </div>
            </div>
          </div>
        )}

        {appState === 'success' && session?.result?.questions && (
          <div className="quiz-content-wrap">
            {session.cached && (
              <div className="cached-banner">
                <Zap size={15} strokeWidth={2} /> Loaded instantly from a previously saved quiz.
              </div>
            )}

            <div className="quiz-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="quiz-header-left">
                <div className="quiz-title">Quiz</div>
                <div className="quiz-meta">
                  <span className="quiz-meta-chip">{totalQuestions} Questions</span>
                  <span className="quiz-progress-text">{answeredCount}/{totalQuestions} answered</span>
                  {session.quiz_status === 'submitted' && session.score != null && (
                    <span className="quiz-progress-text" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      Score: {session.score}/{totalQuestions} ({Math.round(session.percentage)}%)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Quiz Actions */}
              {session.quiz_status !== 'submitted' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => setModalState({ isOpen: true, type: 'resume' })}>
                    Resume Later
                  </Button>
                  <Button onClick={() => setModalState({ isOpen: true, type: 'submit' })}>
                    Submit Quiz
                  </Button>
                </div>
              )}
            </div>

            <div className="quiz-list">
              {session.result.questions.map((q, qIndex) => {
                const isSubmittedQuiz = session.quiz_status === 'submitted';
                const selectedOption = userAnswers[qIndex];
                
                // If it's a submitted quiz, the backend has returned correct_answer_id
                // If not submitted, correct_answer_id is undefined
                const isCorrect = isSubmittedQuiz && selectedOption === q.correct_answer_id;

                return (
                  <div key={qIndex} className="quiz-card">
                    <div className="quiz-card-top">
                      <div className="q-num-badge">{qIndex + 1}</div>
                      <div className="q-body"><p className="q-text">{q.question_text}</p></div>
                    </div>
                    <div className="opt-list">
                      {q.options.map((opt) => {
                        const isSelected = selectedOption === opt.id;
                        const isCorrectOpt = isSubmittedQuiz && opt.id === q.correct_answer_id;

                        let cls = 'opt-item';
                        if (isSubmittedQuiz) {
                          cls += ' opt-submitted';
                          if (isCorrectOpt) cls += ' opt-correct';
                          else if (isSelected) cls += ' opt-wrong';
                          else cls += ' opt-dimmed';
                        } else {
                          if (isSelected) cls += ' opt-selected';
                        }

                        const showDot = isSelected || (isSubmittedQuiz && isCorrectOpt);

                        return (
                          <div
                            key={opt.id}
                            className={cls}
                            onClick={() => handleOptionSelect(qIndex, opt.id)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={isSubmittedQuiz ? -1 : 0}
                            onKeyDown={e => {
                              if (!isSubmittedQuiz && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleOptionSelect(qIndex, opt.id);
                              }
                            }}
                          >
                            <div className="opt-radio">{showDot && <div className="opt-radio-dot" />}</div>
                            <span className="opt-text">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Feedback only shows when quiz is submitted */}
                    {isSubmittedQuiz && q.explanation && (
                      <div className={`answer-feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
                        <div className="feedback-header">
                          {isCorrect ? <CheckCircle2 size={17} strokeWidth={2} /> : <XCircle size={17} strokeWidth={2} />}
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
