import React from 'react';
import { quickActionsData } from '../../data/dashboardData';

export default function QuickActions() {
  return (
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
  );
}
