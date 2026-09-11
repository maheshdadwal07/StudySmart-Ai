import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader, AlertCircle, FileText, Play, HelpCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { apiFetch } from '../api/client';
import Button from '../components/common/Button';
import '../styles/dashboard.css';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filter, setFilter] = useState('all'); // all, study, quiz
  const [search, setSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;
  
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const fetchHistory = async (currentPage, currentFilter, currentSearch) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        type: currentFilter
      });
      
      if (currentSearch.trim()) {
        queryParams.append('search', currentSearch.trim());
      }
      
      const res = await apiFetch(`/api/history?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setHasMore(data.has_more || false);
      } else {
        throw new Error('Failed to load history');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load your history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page, filter, search);
    // eslint-disable-next-line
  }, [page, filter]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1); // Reset page on new search
      fetchHistory(1, filter, val);
    }, 400);
  };

  const handleFilterClick = (newFilter) => {
    if (filter !== newFilter) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  const handleOpenItem = (item) => {
    if (item.type === 'Study') {
      navigate(`/study-mode?sessionId=${item.session_id}`);
    } else if (item.type === 'Quiz') {
      navigate(`/question-mode?sessionId=${item.session_id}`);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p>Review your past study sessions and generated materials.</p>
        </div>
      </div>

      <div className="panel">
        <div className="history-filter-row" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleFilterClick('all')}
              style={{ 
                padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none',
                backgroundColor: filter === 'all' ? 'var(--text)' : 'var(--surface-hover)', 
                color: filter === 'all' ? 'var(--card)' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              All
            </button>
            <button 
              onClick={() => handleFilterClick('study')}
              style={{ 
                padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none',
                backgroundColor: filter === 'study' ? 'var(--text)' : 'var(--surface-hover)', 
                color: filter === 'study' ? 'var(--card)' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              Study
            </button>
            <button 
              onClick={() => handleFilterClick('quiz')}
              style={{ 
                padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none',
                backgroundColor: filter === 'quiz' ? 'var(--text)' : 'var(--surface-hover)', 
                color: filter === 'quiz' ? 'var(--card)' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
            >
              Quiz
            </button>
          </div>

          <div className="input-wrap history-search" style={{ width: '100%', maxWidth: '300px', margin: 0 }}>
            <span className="input-icon"><Search size={16} /></span>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="Search history..." 
              value={search}
              onChange={handleSearchChange}
              style={{ paddingLeft: '40px' }} 
            />
          </div>
        </div>

        {error ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <AlertCircle size={40} color="var(--error-text)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>Error</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
            <Button onClick={() => fetchHistory(page, filter, search)}>Retry</Button>
          </div>
        ) : loading && items.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <Loader size={32} className="spinning" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: 'var(--surface-muted)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>
              {search ? 'No sessions match your search.' : filter === 'study' ? 'No study sessions found.' : filter === 'quiz' ? 'No quiz sessions found.' : 'No study or quiz sessions yet.'}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              {!search && filter !== 'all' ? `Start generating ${filter} sessions to see them here.` : 'Your generated materials will appear here.'}
            </p>
            {!search && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button variant={filter === 'quiz' ? 'secondary' : 'primary'} onClick={() => navigate('/uploads')}>Start Studying</Button>
                <Button variant={filter === 'study' ? 'secondary' : 'primary'} onClick={() => navigate('/question-mode')}>Generate a Quiz</Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px', fontWeight: 600 }}>Session</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600 }}>Type</th>
                    <th className="history-table-date" style={{ padding: '16px 20px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, width: '100px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody style={{ position: 'relative' }}>
                  {loading && (
                    <tr>
                      <td colSpan="4" style={{ padding: '12px', textAlign: 'center', backgroundColor: 'var(--card)', position: 'absolute', width: '100%', height: '100%', zIndex: 10 }}>
                        <Loader size={24} className="spinning" style={{ color: 'var(--primary)', margin: '40px auto' }} />
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.session_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{item.document_name}</div>
                        {item.type === 'Quiz' && item.metadata?.question_count && (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {item.metadata.question_count} Questions • {item.metadata.difficulty}
                          </div>
                        )}
                        {item.status !== 'Completed' && (
                          <div style={{ fontSize: '12px', color: item.status === 'Failed' ? 'var(--error-text)' : 'var(--warning-text)', marginTop: '4px', fontWeight: 500 }}>
                            {item.status}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, backgroundColor: item.type === 'Study' ? 'var(--success-bg)' : 'var(--info-bg)', color: item.type === 'Study' ? 'var(--success-text)' : 'var(--info-text)' }}>
                          {item.type === 'Study' ? <Play size={14} /> : <HelpCircle size={14} />}
                          {item.type}
                        </div>
                      </td>
                      <td className="history-table-date" style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <Button 
                          className="history-open-btn"
                          variant="secondary" 
                          onClick={() => handleOpenItem(item)}
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          disabled={item.status !== 'Completed'}
                        >
                          Open <ChevronRight size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Page {page}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  variant="secondary" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1 || loading}
                  style={{ padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} /> Previous
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={!hasMore || loading}
                  style={{ padding: '6px 12px' }}
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
