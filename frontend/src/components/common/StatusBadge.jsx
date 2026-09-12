import React from "react";
import { Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function StatusBadge({ status, className = "" }) {
  let config = {
    style: {
      backgroundColor: "var(--surface-hover)",
      color: "var(--text-muted)",
      borderColor: "var(--border)",
    },
    icon: null,
    label: status || "Unknown",
  };

  switch (status) {
    case "Pending":
    case "Queued":
      config = {
        style: {
          backgroundColor: "var(--warning-bg)",
          color: "var(--warning-text)",
          borderColor: "var(--warning-border)",
        },
        icon: <Clock size={12} className="mr-1.5" />,
      };
      break;
    case "Processing":
    case "Generating":
      config = {
        style: {
          backgroundColor: "var(--info-bg)",
          color: "var(--info-text)",
          borderColor: "var(--info-border)",
        },
        icon: <Loader2 size={12} className="mr-1.5 spinning" />,
      };
      break;
    case "Processed":
    case "Completed":
      config = {
        style: {
          backgroundColor: "var(--success-bg)",
          color: "var(--success-text)",
          borderColor: "var(--success-border)",
        },
        icon: <CheckCircle2 size={12} className="mr-1.5" />,
      };
      break;
    case "Failed":
      config = {
        style: {
          backgroundColor: "var(--error-bg)",
          color: "var(--error-text)",
          borderColor: "var(--error-border)",
        },
        icon: <XCircle size={12} className="mr-1.5" />,
      };
      break;
  }

  return (
    <span
      style={config.style}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
