import React from 'react';
import { notesData } from '../../../data/studyData';

export default function NotesTab() {
  return (
    <div className="tab-panel active">
      {notesData.map((noteBlock, idx) => (
        <div className="notes-block" key={idx}>
          <h4>{noteBlock.title}</h4>
          <ul>
            {noteBlock.items.map((item, i) => (
              <li key={i}>
                {item.bold && <b>{item.bold}</b>}
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
