import React from 'react';
import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  let config = {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: null,
    label: status || 'Unknown'
  };

  switch (status) {
    case 'Pending':
    case 'Queued':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <Clock size={12} className="mr-1.5" />
      };
      break;
    case 'Processing':
    case 'Generating':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <Loader2 size={12} className="mr-1.5 spinning" />
      };
      break;
    case 'Processed':
    case 'Completed':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: <CheckCircle2 size={12} className="mr-1.5" />
      };
      break;
    case 'Failed':
      config = {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <XCircle size={12} className="mr-1.5" />
      };
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
