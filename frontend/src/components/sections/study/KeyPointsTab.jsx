import React from 'react';
import { keyPointsData } from '../../../data/studyData';

export default function KeyPointsTab() {
  return (
    <div className="tab-panel active">
      <div className="kp-list">
        {keyPointsData.map((point, idx) => {
          const num = (idx + 1).toString().padStart(2, '0');
          return (
            <div className="kp-item" key={idx}>
              <div className="kp-bullet">{num}</div>
              <p>{point}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
