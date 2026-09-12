import React from "react";
import Button from "./Button";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "24px",
          width: "100%",
          maxWidth: "calc(100vw - 32px)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            flexWrap: "wrap",
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
