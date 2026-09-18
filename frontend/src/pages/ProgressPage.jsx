import React, { useState, useEffect } from 'react';
import { Target, HelpCircle, BookOpen } from 'lucide-react';
import { apiFetch } from '../api/client';
import StatCard from '../components/dashboard/StatCard';
import ProgressCard from '../components/dashboard/ProgressCard';
import '../styles/dashboard.css';

export default function ProgressPage() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiFetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStatsData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading progress data...
      </div>
    );
  }

  if (!statsData) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--error-text)' }}>
        Failed to load progress data.
      </div>
    );
  }

  const overallAccuracy = statsData.learning_progress !== "—" ? `${statsData.learning_progress}%` : "—";
  const questionsGenerated = statsData.questions_generated || "0";
  const studySessions = statsData.study_sessions || "0";

  const statCards = [
    {
      title: 'Overall Accuracy',
      value: overallAccuracy,
      trend: null,
      trendDir: null,
      icon: Target,
      iconBg: 'rgba(34,197,94,0.09)',
      iconColor: 'var(--success-text)',
      progress: null,
      progressColor: null,
    },
    {
      title: 'Questions Generated',
      value: questionsGenerated,
      trend: null,
      trendDir: null,
      icon: HelpCircle,
      iconBg: 'rgba(6,182,212,0.09)',
      iconColor: 'var(--info-text)',
      progress: null,
      progressColor: null,
    },
    {
      title: 'Study Sessions',
      value: studySessions,
      trend: null,
      trendDir: null,
      icon: BookOpen,
      iconBg: 'rgba(245,158,11,0.09)',
      iconColor: 'var(--warning-text)',
      progress: null,
      progressColor: null,
    }
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Learning Progress</h1>
          <p>Track your quiz performance and learning activity over time.</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {overallAccuracy === "—" && (
        <div style={{ padding: '20px 24px', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', marginBottom: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Complete and submit a quiz to start tracking your learning progress.</p>
        </div>
      )}

      <div style={{ maxWidth: 600 }}>
        <ProgressCard progress={statsData.progress} />
      </div>
    </>
  );
}
