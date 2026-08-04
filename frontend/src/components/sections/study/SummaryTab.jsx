import React from 'react';
import { summaryData } from '../../../data/studyData';

export default function SummaryTab() {
  return (
    <div className="tab-panel active">
      {summaryData.map((item) => (
        <div className="summary-block" key={item.id}>
          <h4>
            <span className="n">{item.id}</span>
            {item.title}
          </h4>
          <p>{item.content}</p>
        </div>
      ))}
    </div>
  );
}
