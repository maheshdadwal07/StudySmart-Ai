import React from 'react';
import { Upload } from 'lucide-react';
import Button from '../../components/common/Button';
import StatCard from '../../components/dashboard/StatCard';
import WeeklyActivityChart from '../../components/dashboard/WeeklyActivityChart';
import RecentUploads from '../../components/dashboard/RecentUploads';
import ProgressCard from '../../components/dashboard/ProgressCard';
import QuickActions from '../../components/dashboard/QuickActions';
import UploadCard from '../../components/dashboard/UploadCard';
import { statCardsData } from '../../data/dashboardData';

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
          <QuickActions />
          <UploadCard />
        </div>
      </div>
    </>
  );
}
