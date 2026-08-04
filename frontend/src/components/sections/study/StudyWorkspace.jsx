import React, { useState } from 'react';
import { 
  AlignLeft, 
  FileText, 
  HelpCircle, 
  Maximize, 
  Hash, 
  MessageSquare,
  Copy,
  Download,
  Share2
} from 'lucide-react';
import { tabLabels } from '../../../data/studyData';
import SummaryTab from './SummaryTab';
import NotesTab from './NotesTab';
import KeyPointsTab from './KeyPointsTab';
import Flashcards from './Flashcards';
import ImportantTopics from './ImportantTopics';
import Chat from './Chat';

const TABS = [
  { id: 'summary', label: 'Summary', icon: AlignLeft },
  { id: 'notes', label: 'Smart Notes', icon: FileText },
  { id: 'keypoints', label: 'Key Points', icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Maximize },
  { id: 'topics', label: 'Important Topics', icon: Hash },
  { id: 'chat', label: 'Learning Assistant', icon: MessageSquare }
];

export default function StudyWorkspace() {
  const [activeTab, setActiveTab] = useState('summary');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary': return <SummaryTab />;
      case 'notes': return <NotesTab />;
      case 'keypoints': return <KeyPointsTab />;
      case 'flashcards': return <Flashcards />;
      case 'topics': return <ImportantTopics />;
      case 'chat': return <Chat />;
      default: return null;
    }
  };

  return (
    <div className="study-pane">
      <div className="tabs-row">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} strokeWidth={1.7} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pane-toolbar">
        <span className="toolbar-left">{tabLabels[activeTab]}</span>
        <div className="toolbar-right">
          <button className="icon-btn" title="Copy">
            <Copy size={15} stroke="#374151" strokeWidth={1.6} />
          </button>
          <button className="icon-btn" title="Download PDF">
            <Download size={15} stroke="#374151" strokeWidth={1.7} />
          </button>
          <button className="icon-btn" title="Share">
            <Share2 size={15} stroke="#374151" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
