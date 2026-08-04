import React from 'react';
import { topicsData } from '../../../data/studyData';

export default function ImportantTopics() {
  return (
    <div className="tab-panel active">
      <div className="topic-grid">
        {topicsData.map((topic, idx) => (
          <div className="topic-card" key={idx}>
            <div className="th">
              <h5>{topic.title}</h5>
              <span className={`topic-badge ${topic.priorityClass}`}>
                {topic.priority}
              </span>
            </div>
            <p>{topic.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
