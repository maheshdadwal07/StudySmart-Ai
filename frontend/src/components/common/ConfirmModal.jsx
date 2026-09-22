import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  isLoading,
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        opacity: isOpen ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "var(--shadow-lg)",
          transform: isOpen ? "scale(1)" : "scale(0.95)",
          transition: "transform 0.2s ease",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#EF4444",
              borderRadius: "50%",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3
              id="modal-title"
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {title}
            </h3>
            <p
              id="modal-description"
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: "1.5",
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "4px",
          }}
        >
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              backgroundColor: "#EF4444",
              borderColor: "#EF4444",
              color: "#fff",
            }}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
