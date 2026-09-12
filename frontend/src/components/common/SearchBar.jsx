import React, { useState, useEffect, useRef } from "react";
import { Search, FileText, Play, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { useClickOutside } from "../../hooks/useClickOutside";

export default function SearchBar({ placeholder, className = "" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  useClickOutside(searchRef, () => setShowResults(false));

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setIsSearching(true);
      const res = await apiFetch(
        `/api/dashboard/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setQuery("");

    if (result.type === "document") {
      navigate("/uploads");
    } else if (result.type === "study_material") {
      navigate(`/study-mode?sessionId=${result.id}`);
    } else if (result.type === "questions") {
      navigate(`/question-mode?sessionId=${result.id}`);
    }
  };

  const hasResults =
    results &&
    (results.documents?.length > 0 ||
      results.study_materials?.length > 0 ||
      results.questions?.length > 0);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div
        className={`search-box ${className}`}
        style={{ width: "100%", maxWidth: "340px" }}
      >
        <Search size={16} color="#9AA1AE" strokeWidth={1.8} />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && results) {
              setShowResults(true);
            }
          }}
        />
        {placeholder.includes("notes") && <span className="kbd">⌘K</span>}
      </div>

      {showResults && query.trim() && (
        <div
          className="search-results absolute left-0 top-full mt-2 w-full rounded-xl shadow-lg z-50 overflow-hidden"
          style={{ top: "42px" }}
        >
          {isSearching ? (
            <div className="search-result-empty p-4 text-center text-sm">
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="search-result-empty p-4 text-center text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-2">
              {results.documents?.length > 0 && (
                <div className="mb-2">
                  <div className="search-result-label px-4 py-1 text-xs font-bold uppercase tracking-wider">
                    Documents
                  </div>
                  {results.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="search-result-item px-4 py-2 cursor-pointer flex items-center gap-2"
                      onClick={() => handleResultClick(doc)}
                    >
                      <FileText
                        size={14}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <span className="search-result-title text-sm truncate">
                        {doc.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {results.study_materials?.length > 0 && (
                <div className="mb-2">
                  <div className="search-result-label px-4 py-1 text-xs font-bold uppercase tracking-wider">
                    Study Notes
                  </div>
                  {results.study_materials.map((study) => (
                    <div
                      key={study.id}
                      className="search-result-item px-4 py-2 cursor-pointer flex items-center gap-2"
                      onClick={() => handleResultClick(study)}
                    >
                      <Play
                        size={14}
                        className="text-green-500 flex-shrink-0"
                      />
                      <span className="search-result-title text-sm truncate">
                        {study.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {results.questions?.length > 0 && (
                <div>
                  <div className="search-result-label px-4 py-1 text-xs font-bold uppercase tracking-wider">
                    Questions
                  </div>
                  {results.questions.map((q) => (
                    <div
                      key={q.id}
                      className="search-result-item px-4 py-2 cursor-pointer flex items-center gap-2"
                      onClick={() => handleResultClick(q)}
                    >
                      <HelpCircle
                        size={14}
                        className="text-purple-500 flex-shrink-0"
                      />
                      <span className="search-result-title text-sm truncate">
                        {q.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
