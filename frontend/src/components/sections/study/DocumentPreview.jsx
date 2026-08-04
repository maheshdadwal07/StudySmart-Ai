import React from 'react';
import { documentPages } from '../../../data/studyData';
import { ZoomOut, ZoomIn } from 'lucide-react';

export default function DocumentPreview() {
  return (
    <div className="doc-pane">
      <div className="doc-pane-header">
        <span className="lbl">Document Preview</span>
        <div className="zoom-controls">
          <button className="icon-btn" style={{ width: '28px', height: '28px' }}>
            <ZoomOut size={13} stroke="#374151" strokeWidth={2} />
          </button>
          <span>100%</span>
          <button className="icon-btn" style={{ width: '28px', height: '28px' }}>
            <ZoomIn size={13} stroke="#374151" strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="doc-scroll">
        {documentPages.map((page, idx) => (
          <div className="doc-page" key={idx}>
            {page.content.map((block, i) => {
              if (block.type === 'heading') {
                return <h4 key={i}>{block.text}</h4>;
              }
              if (block.type === 'paragraph') {
                return (
                  <p key={i}>
                    {block.text}
                    {block.highlight && <mark>{block.highlight}</mark>}
                    {block.highlight2 && <mark className="hi2">{block.highlight2}</mark>}
                    {block.textAfter}
                  </p>
                );
              }
              return null;
            })}
            <div className="page-num">Page {page.pageId} of 18</div>
          </div>
        ))}
      </div>
    </div>
  );
}
