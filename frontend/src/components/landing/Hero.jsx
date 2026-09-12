import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useReveal } from "../../hooks/useReveal";

const PIPELINE_NODES = [
  {
    label: "Document",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M15 3v5h5" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "AI Processing",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2l2.2 5.2L20 9l-5.8 1.8L12 16l-2.2-5.2L4 9l5.8-1.8L12 2z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Summary",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6h16M4 12h10M4 18h13"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Questions",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
        <path
          d="M9.2 9.5a2.8 2.8 0 115.4.9c-.2.7-.7 1.1-1.2 1.5-.5.4-.9.7-1 1.3M12 16.5h.01"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Dashboard",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="4" width="17" height="16" rx="2.2" strokeWidth="1.6" />
        <path d="M3.5 9.5h17M8 4v5.5" strokeWidth="1.6" />
      </svg>
    ),
  },
];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { ref: pipelineRef, isIn: isPipelineIn } = useReveal();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PIPELINE_NODES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="hero">
      <div className="wrap hero-content">
        <span className="eyebrow">
          <span className="dot"></span>Now generating over 2M study questions a
          month
        </span>
        <h1>
          Turn Any Document Into <span className="grad">Smart Notes</span> &amp;
          AI‑Generated Questions
        </h1>
        <p className="hero-sub">
          Upload PDFs, DOCX files, presentations, or job descriptions and
          instantly generate summaries, notes, interview questions, MCQs, and
          learning material.
        </p>
        <div className="hero-ctas">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Start Free Trial
          </Link>
          <a href="#" className="btn btn-secondary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
            </svg>
            Watch Demo
          </a>
        </div>
        <p className="hero-note">
          No credit card required · 7‑day free trial · Cancel anytime
        </p>
      </div>

      <div className="wrap">
        <div
          className={`pipeline reveal ${isPipelineIn ? "in" : ""}`}
          ref={pipelineRef}
        >
          <div className="pipeline-row">
            {PIPELINE_NODES.map((node, i) => (
              <React.Fragment key={node.label}>
                <div className={`pnode ${i === activeIndex ? "active" : ""}`}>
                  <div className="pnode-icon">{node.icon}</div>
                  <div className="pnode-label">{node.label}</div>
                </div>
                {i < PIPELINE_NODES.length - 1 && (
                  <div className="pconnector"></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="pipeline-caption">
            Watch it happen live: <b>a single upload</b> becomes a full study
            kit in under 30 seconds.
          </p>
        </div>
      </div>
    </header>
  );
}
