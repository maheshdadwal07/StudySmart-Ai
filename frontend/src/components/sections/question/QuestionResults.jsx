import React from "react";
import { RefreshCw } from "lucide-react";
import QuestionCard from "./QuestionCard";
import { questions } from "../../../data/questionData";

export default function QuestionResults({ difficulty, documentMeta }) {
  // Normally this would be derived from backend responses or the active generated list
  const generatedCount = 12; // Static mock for now to match UI design

  return (
    <main className="results-area">
      <div className="results-header">
        <div>
          <div className="results-title">
            {generatedCount} questions generated
          </div>
          <div className="results-sub">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}{" "}
            difficulty · MCQ &amp; Long Answer · From {documentMeta.title}
          </div>
        </div>
        <div className="results-actions">
          <button className="btn btn-secondary">
            <RefreshCw size={14} stroke="currentColor" strokeWidth={2} />
            Regenerate All
          </button>
        </div>
      </div>

      <div className="q-list">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>

      <div className="load-more">Load 8 more questions</div>
    </main>
  );
}
