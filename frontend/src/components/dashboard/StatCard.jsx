import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, trend, trendDir, icon: Icon, iconBg, iconColor, progress, progressColor }) {
  const isUp = trendDir === 'up';
  
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon" style={{ background: iconBg }}>
          <Icon size={18} color={iconColor} strokeWidth={1.7} />
        </div>
        <span className={`stat-trend ${isUp ? 'up' : 'down'}`}>
          {isUp ? (
            <TrendingUp size={12} strokeWidth={2} />
          ) : (
            <TrendingDown size={12} strokeWidth={2} />
          )}
          {trend}
        </span>
      </div>
      <div className="stat-num">{value}</div>
      <div className="stat-label">{title}</div>
      
      {progress !== null && (
        <div className="stat-sub">
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%`, background: progressColor }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
