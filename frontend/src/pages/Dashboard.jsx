import React from 'react';
import { Upload } from 'lucide-react';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import WeeklyActivityChart from '../components/dashboard/WeeklyActivityChart';
import RecentUploads from '../components/dashboard/RecentUploads';
import ProgressCard from '../components/dashboard/ProgressCard';
import { statCardsData, quickActionsData } from '../data/dashboardData';

export default function Dashboard() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Good morning, Aarav 👋</h1>
          <p>Here's what's happening with your study material today.</p>
        </div>
        <Button variant="primary">
          <Upload size={15} strokeWidth={2} />
          Upload Document
        </Button>
      </div>

      <div className="stat-grid">
        {statCardsData.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="grid-2col">
        {/* LEFT COLUMN */}
        <div>
          <WeeklyActivityChart />
          <RecentUploads />
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <ProgressCard />
          
          <div className="panel">
            <div className="panel-head">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              {quickActionsData.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <div className="quick-action" key={idx}>
                    <div className="qi">
                      <Icon size={16} color={action.iconColor} strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="qt">{action.title}</div>
                      <div className="qs">{action.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-head">
              <h3>Upload New Document</h3>
            </div>
            <div className="upload-cta">
              <Upload size={34} color="#9AA1AE" strokeWidth={1.7} style={{ margin: '0 auto 12px' }} />
              <div className="t">Drag &amp; drop a file</div>
              <div className="s">PDF, DOCX, PPTX or TXT — up to 25MB</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
